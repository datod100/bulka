import { Component, OnInit, OnDestroy } from '@angular/core';
import { Order, Client, OrderItem, Group, RefundItem, Price } from '../../_models/index';
import { ClientService, AlertService, ProductService, ReportsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions } from "ag-grid/main";
import { DecimalPipe } from '@angular/common';
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
  client: Client = new Client();
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
            return Object.assign(
              { backgroundColor: '#f6f6f6' },
              (params.value && params.data.type == 'נשלח') ? { height: "200%", paddingTop: "10px", zIndex: "100" } : {},
              (params.value && params.data.type != 'נשלח') ? { backgroundColor: '#43dbe2bd' } : {},
              params.data.cellStyle
            );
          }
        },
        valueFormatter: (params) => {
          if (params.data.type == 'נשלח'){
            return (params.value) ? moment(params.value).format('DD/MM/YYYY') : null
          }else{
            return params.value;
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
      if (params['id']) {
        this.client_id = +params['id'];
      }
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
        if (this.client_id){
          this.client = this.clients.find(x => x.client_id == this.client_id);
        }else{
          this.client = this.clients[0];
        }

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

    let temp = [];
    var myArr = Array.from(this.dates)
    for (let item of myArr) {
      var row = { date: item, clients: [], orders: [], refunds: [] };
      row.orders = Array.from(new Set(this.rawOrders.filter(x => x.order_date == item).map(item => [{ product_id: item.product_id, quantity: item.total_quantity, sum: item.total_sum }])));
      row.refunds = Array.from(new Set(this.rawRefunds.filter(x => x.refund_date == item).map(item => [{ product_id: item.product_id, quantity: item.total_quantity, sum: item.total_sum }])));
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
    this.tableData = [];
    this.loading = true;
    Observable.forkJoin(
      this.reportsService.getSalesReport(this.start_date, this.end_date, this.client_id)
    ).subscribe(
      data => {
        this.rawOrders = data[0][0];
        this.rawRefunds = data[0][1];

        let dates = this.getDates();
        let sums = [];
        for (let i = 0; i < dates.length; i++) {
          let orders = { date: dates[i].date, type: 'נשלח' };
          for (let order of dates[i].orders) {
            orders['product' + order[0].product_id] = order[0].quantity;
            if (!('product' + order[0].product_id in sums)) sums['product' + order[0].product_id] = { quantity: 0, sum: 0 };
            sums['product' + order[0].product_id].quantity += order[0].quantity;
            sums['product' + order[0].product_id].sum += order[0].sum;
          }
          this.tableData.push(orders);
          let refunds = { type: 'זיכוי' };
          for (let refund of dates[i].refunds) {
            refunds['product' + refund[0].product_id] = refund[0].quantity;
            if (!('product' + refund[0].product_id in sums)) sums['product' + refund[0].product_id] = { quantity: 0, sum: 0 };
            sums['product' + refund[0].product_id].quantity -= refund[0].quantity;
            sums['product' + refund[0].product_id].sum -= refund[0].sum;
          }
          this.tableData.push(refunds);
          this.tableData.push({ delimiter: true });
        }

        let totalQuantity = { type: 'סה"כ מוצרים', cellStyle: { fontWeight: 'bold', direction: 'ltr', paddingLeft: '2px !important', paddingRight: '2px !important' } };
        let totalSum = { type: 'לתשלום', cellStyle: { fontWeight: 'bold', direction: 'ltr', paddingLeft: '2px !important', paddingRight: '2px !important' }, formatter: " ₪" }

        let grandTotal = 0;
        for (var product in sums) {
          if (sums.hasOwnProperty(product)) {
            totalQuantity[product] = sums[product].quantity;
            totalSum[product] = sums[product].sum;
            grandTotal += sums[product].sum;
          }
        }
        this.displayTotal = grandTotal;
        totalSum["date"] = new DecimalPipe('en-US').transform(grandTotal, '1.0-2') + totalSum.formatter;
        this.tableData.push(totalQuantity);
        this.tableData.push(totalSum);
        this.tableData.push({ delimiter: true });

        //this.calcTable();

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
      let colWidth = this.products[k].width+6;

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
              return new DecimalPipe('en-US').transform(params.value, '1.0-2') + params.data.formatter;
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

  showFilterByClient() {
    this.displayAddClientDialog = true;
  }

  filterByClient(client: Client) {
    this.displayAddClientDialog = false;
    this.client_id = client.client_id;
    this.loadData();
  }

  showAll() {
    this.gridApi.setRowData(this.tableData);
    this.displayTotal = this.total;
    this.displayAddClientDialog = false;
  }
}
