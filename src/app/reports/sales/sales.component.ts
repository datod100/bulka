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
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})

export class SalesComponent implements OnInit, OnDestroy {
  gridOptions: GridOptions;
  columnDefs: any[];
  groups: Group[];
  private context;
  private gridApi: GridApi;
  rawOrders = [];
  rawRefunds = [];
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
  dates;
  client_id:number;
  client:Client = new Client();
  private sub: any;
  


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
        headerName: "תאריך", field: "date", width: 100, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle);
          }
        }
      },
      {
        headerName: "", field: "type", width: 100, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#f6f6f6' }, params.data.cellStyle);
          }
        }
      }
    ];
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngOnInit() {
    this.loading = true;

    this.sub = this.route.params.subscribe(params => {
      this.client_id = +params['id'];
    });
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
        this.client = this.clients.find(x=>x.client_id == this.client_id);

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

  getDates() {
    //get dates
    this.dates = new Set(
      this.rawOrders.map(item => item.order_date).concat(this.rawRefunds.map(item => item.refund_date))
    );

    let temp =[];
    var myArr = Array.from(this.dates)
    for (let item of myArr){
      var row = {date:item, clients:[],orders:[], refunds:[]};
      row.orders = Array.from(new Set(this.rawOrders.filter(x=>x.order_date==item).map(item => [item.product_id, item.total_quantity])));
      row.refunds = Array.from(new Set(this.rawRefunds.filter(x=>x.refund_date==item).map(item => [item.product_id, item.total_quantity])));
      temp.push(row);
    }
    
    temp.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });
    return temp;
  }

  private loadData() {
    this.clearTable();
    this.loading = true;
    Observable.forkJoin(
      this.reportsService.getSalesReport(this.start_date, this.end_date, this.client_id)
    ).subscribe(
      data => {
        this.rawOrders = data[0][0];
        this.rawRefunds = data[0][1];

        let dates = this.getDates();
        
        for (let i = 0; i < dates.length; i++) {
            let orders = {date: dates[i].date, type:'נשלח'};            
            for (let order of dates[i].orders) {
              orders['product' + order[0]] = order[1];
            }
            this.tableData.push(orders);
            let refunds = {type:'זיכוי'};            
            for (let refund of dates[i].refunds) {
              refunds['product' + refund[0]] = refund[1];
            }
            this.tableData.push(refunds);
        }
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
    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width;

      this.columnDefs.push({
        headerName: this.products[k].name,
        headerClass: "header-cell",
        field: "product" + this.products[k].product_id,
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
    //this.gridApi.setRowData(this.tableData);
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
    for (let i = 0; i < this.tableData.length; i = i + 6) {
      let sum = 0;
      for (let k = 0; k < this.products.length; k++) {
        let prop = 'product' + this.products[k].product_id;
        let order = 0;
        let refund = 0;
        if (prop in this.tableData[i + 1]) {
          order = this.tableData[i + 1][prop];
        }
        if (prop in this.tableData[i + 2]) {
          refund = this.tableData[i + 2][prop];
        }

        let price = this.tableData[i].client.prices.find(p => p.product.product_id == this.products[k].product_id);
        if (price != null && price.price != null) {
          this.tableData[i + 3]['product' + this.products[k].product_id] = order - refund;
          let colSum = (order - refund) * +price.price;
          this.tableData[i + 4]['product' + this.products[k].product_id] = colSum;
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
    window.location.href = "/reports/sales/"+client.client_id;
  }

  showAll() {
    this.gridApi.setRowData(this.tableData);
    this.displayTotal = this.total;
    this.displayAddClientDialog = false;
  }
}
