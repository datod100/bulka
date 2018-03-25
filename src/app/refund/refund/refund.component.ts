import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem, RefundItem, Price } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService, GroupService, RefundsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';
import { isArray } from 'util';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.css']
})
export class RefundComponent implements OnInit, OnDestroy {

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
  sub;
  isNew = false;
  loading = false;
  maxDate = new Date();
  selectedDate: Date;

  constructor(private statusesService: StatusesService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private refundsService: RefundsService,
    private productService: ProductService,
    private alertService: AlertService,
    private confirmationService: ConfirmationService,
    private groupService: GroupService,
    private clientService: ClientService) {

    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";
    this.context = { componentParent: this };
    this.maxDate.setHours(0, 0, 0, 0);
    moment.locale('en-il');

    this.columnDefs = [
      {
        headerName: "שם הלקוח", field: "client.name", width: 180, editable: false, cellClass: "header-bold"
      },
      {
        headerName: "איש קשר", field: "client.contact_person", width: 100, editable: false, cellClass: "header-bold"
      },
      {
        headerName: "טלפון", field: "client.phone", width: 110, editable: false, cellClass: "header-bold"
      }
    ];
  }

  setGridEdit(state: Boolean) {
    for (let k = 0; k < this.products.length; k++) {
      for (let i = 0; i < this.columnDefs.length; i++) {
        if (this.columnDefs[i].field == "product" + this.products[k].product_id) {
          this.columnDefs[i].editable = state;
        }
      }
    }
    this.gridApi.setColumnDefs(this.columnDefs);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.refund_id = +params['id'];
      var action = params['action'];
      if (isNaN(this.refund_id)) {
        this.refundsService.getTodayRefundId().subscribe(data => {
          data.refund_date = moment(data.refund_date).toDate();
          this.refund = data;
          this.refund_id = data.refund_id;
          this.selectedDate = data.refund_date;
        }
        );
        this.isNew = true;
      } else {
        this.refundsService.getRefundById(this.refund_id).subscribe(data => {
          data.refund_date = moment(data.refund_date).toDate();
          this.selectedDate = data.refund_date;
          this.refund = data;
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onGridReady(params) {
    this.gridApi = params.api;

    Observable.forkJoin(
      this.productService.getAll(),
      this.groupService.getAll(),
      this.clientService.getAll(),
      this.statusesService.getStatuses()
    ).subscribe(
      data => {
        this.products = data[0];
        this.groups = data[1];
        this.clients = data[2];
        this.statuses = data[3];


        let clients_counter = 0;
        for (let i = 0; i < this.clients.length; i++) {
          this.clientService.getPricesByClientId(this.clients[i].client_id).subscribe(
            prices => {
              this.clients[i].prices = [];
              for (let k = 0; k < this.products.length; k++) {
                let price = prices.find(p => p.product_id == this.products[k].product_id);
                this.clients[i].prices.push(new Price(this.products[k], (price) ? price.price : null));
              }
              clients_counter++;
              if (clients_counter == this.clients.length) {
                this.buildTable();

                if (!isNaN(this.refund_id)) {
                  this.loadOrder();
                } else {
                  //this.fillNewOrder();
                }
              }
            }
          )
        }


      }
    );

    //params.api.sizeColumnsToFit();
    //this.gridApi.resetRowHeights();
  }

  loadOrder() {
    Observable.forkJoin(
      this.refundsService.getRefundProducts(this.refund_id)
    ).subscribe(
      data => {
        this.refundLines = data[0];

        if (this.refundLines.length > 0) {
          for (let i = 0; i < this.refundLines.length; i++) {

            let row = this.tableData.find(c => c.client.client_id == this.refundLines[i].client_id);
            row["product" + this.refundLines[i].product_id] = this.refundLines[i].quantity;
          }
        }

        this.gridApi.setRowData(this.tableData);
      },
      err => console.error(err)
    );

  }

  private buildTable() {
    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width + 12;

      this.columnDefs.push({
        headerName: this.products[k].name,
        headerClass: "header-cell",
        cellClass: "center",
        field: "product" + this.products[k].product_id,
        editable: function (params) {
          if (params.data.disableEdit) return false
          let price = params.data.client.prices.find(p => p.product.name == params.colDef.headerName);
          if (price.price == null) return false;
          return true;
        },
        width: (colWidth < 80) ? 80 : colWidth, cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyleRow) {
            style += Object.assign(style, params.data.cellStyleRow);
          }
          let price = params.data.client.prices.find(p => p.product.name == params.colDef.headerName);
          if (params.data.disableEdit || price.price == null) {
            style.backgroundColor = "#d9d9d9";
          }
          return style;
        }
      });
    }

    for (let i = 0; i < this.clients.length; i++) {
      let row = { client: this.clients[i] };
      this.tableData.push(row);
    }
    this.gridApi.setColumnDefs(this.columnDefs);
    this.gridApi.setRowData(this.tableData);
    this.calcGridWidth();

  }

  private calcGridWidth() {
    let screenWidth = window.outerWidth;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 2;
    this.tableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };
    this.gridApi.doLayout();
  }


  tableCellValueChanged(params) {
    if (params.colDef.field != 'status' && params.colDef.field != 'supply_time' && params.colDef.field != 'group') {
      if (isNaN(+params.value)) {
        params.data[params.colDef.field] = null;
      }
    }
    this.gridApi.setRowData(this.tableData);
  }

  onDateChange(newDate: Date) {
    this.clearTable();
    this.isNew = false;
    this.selectedDate = newDate;
    if (newDate.getTime() == this.maxDate.getTime()) {
      this.isNew = true;
    }
    this.refundsService.getRefundByDate(newDate).subscribe(
      data => {
        if (data.refund_date) {
          data.refund_date = moment(data.refund_date).toDate();
          this.refund = data;
          this.refund_id = this.refund.refund_id;
          this.loadOrder();
        } else {
          this.refund_id = 0;
        }
      }
    );
    //this.setGridEdit(this.isNew);
  }

  copyToToday() {
    this.refundsService.getTodayRefundId().subscribe(data => {
      data.refund_date = moment(data.refund_date).toDate();
      this.refund = data;
      this.refund_id = data.refund_id;
      this.isNew = true;
      this.saveOrder();
    });
  }

  clearTable() {
    this.confirmationService.confirm({
      message: 'האם אתה בטוח שברצונך לנקות טבלה?',
      header: 'אישור',
      icon: 'fa fa-question-circle',
      accept: () => {
        this.gridApi.stopEditing(false);
        for (let i = 0; i < this.tableData.length; i++) {
          for (let k = 0; k < this.products.length; k++) {
            this.tableData[i]["product" + this.products[k].product_id] = "";
          }
        }
        this.gridApi.setRowData(this.tableData);
      }
    });
  }

  saveOrderAction() {
    this.loading = true;

    let items: RefundItem[] = [];
    for (let i = 0; i < this.tableData.length; i++) {
      for (let k = 0; k < this.products.length; k++) {
        let quantity = this.tableData[i]["product" + this.products[k].product_id];
        if (quantity) {
          let itm = new RefundItem();
          itm.client_id = this.tableData[i].client.client_id;
          itm.product_id = this.products[k].product_id;
          itm.quantity = +quantity;
          itm.refund_id = this.refund_id;
          items.push(itm);
        }
      }
    }
    this.refundsService.saveRefund(items, this.refund_id).subscribe(
      data => {
        if (isArray(data)) {
          this.alertService.success("רשומות עודכנו בהצלחה");
        } else {
          this.alertService.error("אירעה שגיאה בלתי צפויה");
        }

        this.loading = false;
      },
      err => {
        this.alertService.error("אירעה שגיאה בלתי צפויה");
        this.loading = false;
      }
    );
  }

  saveOrder() {
    this.gridApi.stopEditing(false);

    if (this.refund_id == 0) {
      this.refundsService.getRefundIdByDate(this.selectedDate).subscribe(data => {
        data.refund_date = moment(data.refund_date).toDate();
        this.refund = data;
        this.refund_id = data.refund_id;

        this.saveOrderAction();
      });
    } else {
      this.saveOrderAction();
    }


  }

}
