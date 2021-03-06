import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem, RefundItem, Price } from '../../_models/index';
import { ClientService, AlertService, ProductService, ReportsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';
import { isArray } from 'util';
import { DatePipe, DecimalPipe } from '@angular/common';
import * as moment from 'moment';

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css']
})
export class BalanceReportComponent implements OnInit {
  gridOptions: GridOptions;
  columnDefs: any[];
  groups: Group[];
  private context;
  private gridApi: GridApi;
  tableData = [];
  filteredTableData = [];
  products = [];
  tableStyle;
  statuses: string[] = [];
  rowSelection;
  public clients: Client[] = [];
  public active_clients: Client[] = [];
  refund_id;
  refund = { refund_id: 0, refund_date: null };
  refundLines: RefundItem[];
  isNew = false;
  loading = false;
  start_date: Date;
  startDisplayDate: Date;
  end_date: Date;
  endDisplayDate: Date;
  total = 0;
  displayTotal = 0;
  displayAddClientDialog = false;


  public set StartDate(newDate: Date) {
    this.startDisplayDate = newDate;
    this.start_date = moment(newDate).subtract(1, 'days').toDate();
  }

  public get StartDate(): Date {
    return this.startDisplayDate;
  }

  public set EndDate(newDate: Date) {
    this.endDisplayDate = newDate;
    this.end_date = moment(newDate).subtract(1, 'days').toDate();
  }

  public get EndDate(): Date {
    return this.endDisplayDate;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private productService: ProductService,
    private alertService: AlertService,
    private clientService: ClientService,
    private reportsService: ReportsService) {

    moment.locale('en-il');

    this.EndDate = moment().startOf('day').toDate();
    this.StartDate = moment().startOf('day').subtract(7, 'days').toDate();

    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";
    this.context = { componentParent: this };
    this.gridOptions.getRowStyle = function (params) {
      if (params.data.delimiter) {
        return { backgroundColor: 'darkgrey !important' };
      }
    }

    this.gridOptions.getRowHeight = function (params) {
      if (params.data.delimiter) {
        return 5;
      } else {
        return 25;
      }
    }

    this.columnDefs = [
      {
        headerName: "", field: "type", width: 100, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle);
          }
        }
      },
      {
        headerName: "שם הלקוח", field: "client.name", width: 180, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle);
          }
        }
      },
      {
        headerName: "איש קשר", field: "client.contact_person", width: 100, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle);
          }
        }
      },
      {
        headerName: "טלפון", field: "client.phone", width: 110, editable: false, cellClass: 'center', cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle, params.data.cellSumStyle);
          }
        }
      }
    ];
  }

  ngOnInit() {
    this.loading = true;
  }

  onGridReady(params) {
    this.gridApi = params.api;

    Observable.forkJoin(
      this.productService.getAll(),
      this.clientService.getAll()
    ).subscribe(
      data => {
        this.products = data[0];
        this.clients = data[1];

        let clients_count = 0;
        for (let i = 0; i < this.clients.length; i++) {
          this.clientService.getPricesByClientId(this.clients[i].client_id).subscribe(
            prices => {
              clients_count++;
              this.clients[i].prices = [];
              for (let k = 0; k < this.products.length; k++) {
                let price = prices.find(p => p.product_id == this.products[k].product_id);
                this.clients[i].prices.push(new Price(this.products[k], (price) ? price.price : null));
              };
              if (clients_count == this.clients.length) {
                this.buildTable();
                this.loadData();
              }
            }
          )
        }


      }
    );
  }

  private loadData() {
    this.tableData=[];

    for (let i = 0; i < this.clients.length; i++) {
      this.tableData.push({ type: 'לקוח', client: this.clients[i], cellStyle: { backgroundColor: 'white' } });
      this.tableData.push({ type: 'נשלח' });
      this.tableData.push({ type: 'זיכוי' });
      this.tableData.push({ type: 'סה"כ מוצרים', cellStyle: { fontWeight: 'bold', direction: 'ltr', paddingLeft: '2px !important', paddingRight: '2px !important'} });
      this.tableData.push({ type: 'לתשלום', cellStyle: { fontWeight: 'bold', direction: 'ltr', paddingLeft: '2px !important', paddingRight: '2px !important'}, formatter: " ₪" });
      this.tableData.push({ delimiter: true });
    }
    this.gridApi.setRowData(this.tableData);

    //this.clearTable();
    this.loading = true;
    Observable.forkJoin(
      this.reportsService.getBalanceReport(this.start_date, this.end_date)
    ).subscribe(
      data => {
        let orders = data[0][0];
        let refunds = data[0][1];

        for (let k = 0; k < orders.length; k++) {
          for (let i = 0; i < this.tableData.length; i++) {
            if (this.tableData[i].type == 'נשלח') {
              if (this.tableData[i - 1].client && this.tableData[i - 1].client.client_id == orders[k].client_id) {
                this.tableData[i]['product' + orders[k].product_id] = orders[k]//.total_quantity
              }
            }
          }
        }

        for (let k = 0; k < refunds.length; k++) {
          for (let i = 0; i < this.tableData.length; i++) {
            if (this.tableData[i].type == 'זיכוי') {
              if (this.tableData[i - 2].client && this.tableData[i - 2].client.client_id == refunds[k].client_id) {
                this.tableData[i]['product' + refunds[k].product_id] = refunds[k]//.total_quantity
              }
            }
          }
        }

        this.calcTable();

        this.gridApi.setRowData(this.tableData);
        this.alertService.success('טבלה עודכנה');
        this.loading = false;
      },
      err => {
        console.error(err);
        this.loading = true;
      }
    );
  }

  private buildTable() {
    this.tableData=[];
    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width+6;

      this.columnDefs.push({
        headerName: this.products[k].name,
        headerClass: "header-cell",
        field: "product" + this.products[k].product_id+".total_quantity",
        cellStyle: (params) => {
          return params.data.cellStyle
        },
        cellClass: "center",
        valueFormatter: (params) => {
          if (params.value) {
            if (params.data.formatter) {
              return precisionRound(params.value, 2) + params.data.formatter;
            }
          }
          return params.value;
        },
        width: (colWidth < 80) ? 80 : colWidth
      });
    }

    this.gridApi.setColumnDefs(this.columnDefs);
    this.calcGrid();
  }

  private calcGrid() {
    let screenWidth = window.outerWidth;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }

    newWidth += 2;
    this.tableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };

    this.gridApi.doLayout();
  }


  onDateChange(newDate: Date) {
    if (this.end_date < this.start_date) {
      this.alertService.error('תאריך סיום צריך להיות גדול יותר מהתחלה');
    }
  }


  calcTable() {
    this.total = 0;
    this.active_clients=[];
    for (let i = 0; i < this.tableData.length; i = i + 6) {
      let sum = 0;
      for (let k = 0; k < this.products.length; k++) {
        let prop = 'product' + this.products[k].product_id;
        let order = 0;
        let refund = 0;
        if (prop in this.tableData[i + 1]) {
          order = this.tableData[i + 1][prop].total_quantity;
          if (!order) order = 0;
        }
        if (prop in this.tableData[i + 2]) {
          refund = this.tableData[i + 2][prop].total_quantity;
          if (!refund) refund = 0;
        }

        //let price = this.tableData[i].client.prices.find(p => p.product.product_id == this.products[k].product_id);

        //if (price != null && price.price != null) 
        if (order || refund){
          this.tableData[i + 3][prop] = {total_quantity:order - refund};
          let colSum = ((order)?this.tableData[i + 1][prop].total_sum:0) - ((refund)?this.tableData[i + 2][prop].total_sum:0);
          this.tableData[i + 4][prop] = {total_quantity:colSum};
          sum += colSum;
        }
      }
      this.total += sum;
      this.tableData[i + 4].total = sum;
      this.tableData[i + 4].client = new Client();
      this.tableData[i + 4].client.phone = new DecimalPipe('en-US').transform(sum, '1.0-2') + " ₪";
      this.tableData[i + 4].cellSumStyle = { fontWeight: 'bold', backgroundColor: '#43dbe2bd' };
    }

    
    for (let i = this.tableData.length - 2; i > 0; i = i - 6) {
      if (this.tableData[i].total == 0) {
        this.tableData.splice(i - 4, 6);
      } else {
        this.active_clients.push(this.tableData[i - 4].client);
      }
    }
    
    

    this.displayTotal = this.total;
    this.active_clients.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  clearTable() {
    this.gridApi.stopEditing(false);
    for (let i = 0; i < this.tableData.length; i++) {
      for (let k = 0; k < this.products.length; k++) {
        this.tableData[i]["product" + this.products[k].product_id] = "";
      }
    }
    this.gridApi.setRowData(this.tableData);
  }

  showFilterByClient() {
    this.displayAddClientDialog = true;
  }

  filterByClient(client: Client) {
    this.displayAddClientDialog = false;
    this.filteredTableData = [];
    for (let i = 0; i < this.tableData.length; i = i + 6) {
      if (this.tableData[i].client.name == client.name) {
        this.filteredTableData.push(this.tableData[i]);
        this.filteredTableData.push(this.tableData[i + 1]);
        this.filteredTableData.push(this.tableData[i + 2]);
        this.filteredTableData.push(this.tableData[i + 3]);
        this.filteredTableData.push(this.tableData[i + 4]);
        this.displayTotal = this.tableData[i + 4].total;
      }
    }
    this.gridApi.setRowData(this.filteredTableData);
  }

  showAll() {
    this.gridApi.setRowData(this.tableData);
    this.displayTotal = this.total;
    this.displayAddClientDialog = false;
  }
}
