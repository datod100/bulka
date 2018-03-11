import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem, RefundItem } from '../../_models/index';
import { ClientService, AlertService, ProductService, ReportsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';
import { isArray } from 'util';
import { DatePipe } from '@angular/common';


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
  maxDate = new Date();
  start_date = new Date();
  end_date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private productService: ProductService,
    private alertService: AlertService,
    private clientService: ClientService,
    private reportsService: ReportsService) {


    this.start_date = new Date();
    this.start_date.setDate(this.start_date.getDate() - 7);

    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";
    this.context = { componentParent: this };
    this.maxDate.setHours(0, 0, 0, 0);
    this.gridOptions.getRowStyle = function (params) {
      if (params.data.delimiter) {
        return { backgroundColor: 'darkgrey !important' };
      }
    }

    this.gridOptions.getRowHeight = function (params) {
      if (params.data.delimiter) {
        return 5;
      }else{
        return 25;
      }
    }

    this.columnDefs = [
      {
        headerName: "", field: "type", width: 80, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return Object.assign({ backgroundColor: '#ccccccbd' }, params.data.cellStyle);
          }
        }
      },
      {
        headerName: "שם הלקוח", field: "client.name", width: 180, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return { backgroundColor: '#ccccccbd' };
          }
        }
      },
      {
        headerName: "איש קשר", field: "client.contact_person", width: 100, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return { backgroundColor: '#ccccccbd' };
          }
        }
      },
      {
        headerName: "טלפון", field: "client.phone", width: 110, editable: false, cellStyle: (params) => {
          if (!params.data.delimiter) {
            return { backgroundColor: '#ccccccbd' };
          }
        }
      }
    ];
  }

  formatDate(unfDate) {
    const [y, m, d] = unfDate.split('-').map((val: string) => +val);
    return new Date(y, m - 1, d);
  }

  ngOnInit() {
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

        this.buildTable();

        this.loadData();
      }
    );
  }

  private loadData(){
    this.clearTable();
    this.loading=true;
    Observable.forkJoin(
      this.reportsService.getBalanceReport(this.start_date, this.end_date)
    ).subscribe(
      data => {
        let orders = data[0][0];
        let refunds = data[0][1];

        for (let k = 0; k < orders.length; k++) {
          for (let i = 0; i < this.tableData.length; i++) {
            if (this.tableData[i].client && this.tableData[i].client.client_id == orders[k].client_id){
              if (this.tableData[i].type == 'נשלח'){
                this.tableData[i]['product'+orders[k].product_id] = orders[k].total_quantity
              }
            }
          }
        }

        for (let k = 0; k < refunds.length; k++) {
          for (let i = 0; i < this.tableData.length; i++) {
            if (this.tableData[i].client && this.tableData[i].client.client_id == refunds[k].client_id){
              if (this.tableData[i].type == 'זיכוי'){
                this.tableData[i]['product'+refunds[k].product_id] = refunds[k].total_quantity
              }
            }
          }
        }

        this.calcTable();

        this.gridApi.setRowData(this.tableData);
        this.alertService.success('טבלה עודכנה');
        this.loading=false;
      },
      err =>{
        console.error(err);
        this.loading=true;
      }
    );
  }  

  private buildTable() {
    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].name.length * 9;

      this.columnDefs.push({
        headerName: this.products[k].name,
        field: "product" + this.products[k].product_id,
        cellStyle : (params) => {return params.data.cellStyle},
        width: (colWidth < 80) ? 80 : colWidth
      });
    }

    for (let i = 0; i < this.clients.length; i++) {
      this.tableData.push({ type: 'נשלח', client: this.clients[i] });
      this.tableData.push({ type: 'זיכוי', client: this.clients[i] });
      this.tableData.push({ type: 'סה"כ', cellStyle: { fontWeight: 'bold', direction: 'ltr' } });
      this.tableData.push({ delimiter: true });
    }

    this.gridApi.setColumnDefs(this.columnDefs);
    this.gridApi.setRowData(this.tableData);
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
    if (this.end_date<this.start_date){
      this.alertService.error('תאריך סיום צריך להיות גדול יותר מהתחלה');
    }
  }


  calcTable() {
    for (let k = 0; k < this.products.length; k++) {
      for (let i = 0; i < this.tableData.length; i=i+4) {
        let prop = 'product'+this.products[k].product_id;
        let order = 0;
        let refund = 0;
        if (prop in this.tableData[i]){
          order = this.tableData[i][prop];
        }
        if (prop in this.tableData[i+1]){
          refund = this.tableData[i+1][prop];
        }
        
        this.tableData[i+2]['product'+this.products[k].product_id] = order-refund;
      }
    }
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
}
