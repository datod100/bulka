import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService, GroupService, DocsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons, NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';
import { Price } from '../../_models/price';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';
import { NgxSpinnerService } from 'ngx-spinner';
import { isNullOrUndefined } from 'util';

function checkKey(event) {
  let e = <KeyboardEvent>event;
  if ([46, 8, 9, 27, 13, 110, 190, 17].indexOf(e.keyCode) !== -1 ||
    // Allow: Ctrl+A
    (e.keyCode == 65 && e.ctrlKey === true) ||
    // Allow: Ctrl+V
    (e.keyCode == 86 && e.ctrlKey === true) ||
    // Allow: Ctrl+C
    (e.keyCode == 67 && e.ctrlKey === true) ||
    // Allow: Ctrl+X
    (e.keyCode == 88 && e.ctrlKey === true) ||
    // Allow: home, end, left, right
    (e.keyCode >= 35 && e.keyCode <= 39)) {
    // let it happen, don't do anything
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
}

@Component({
  selector: 'app-orders-edit',
  templateUrl: './orders-edit.component.html',
  styleUrls: ['./orders-edit.component.css'],
  providers: [NgbDropdownConfig] // add NgbDropdownConfig to the component providers
})

export class OrdersEditComponent implements OnInit, OnDestroy {

  gridOptions: GridOptions;
  gridOptions2: GridOptions;
  columnDefs: any[];
  columnDefs2: any[];
  private context;
  private context2;
  private gridApi: GridApi;
  private gridApi2: GridApi;

  headerData = [];
  tableData = [];
  products = [];
  cycles = [];
  headerTableStyle;
  tableStyle;
  maxWidth;
  groups: Group[] = [];
  summaryItems: OrderSummaryItem[] = [];
  orderLines: Order[] = [];
  orderProducts: OrderItem[] = [];
  statuses: string[] = [];
  allowEdit: boolean = false;
  title;
  rowSelection;
  public clients: Client[] = [];
  activeClients: Client[] = [];
  order_id: number;
  orderDate: Date;
  orderDisplayDate: Date;
  orderDateNote = "";
  activeDates: Date[] = [];
  private sub: any;
  index = 0;
  loading = false;
  headerBuilt = false;
  saving = false;
  serverDate;
  displayAddClientDialog: boolean = false;

  get OrderDisplayDate(): Date {
    return this.orderDisplayDate;
  }

  set OrderDisplayDate(newDisplayDate: Date) {
    this.orderDisplayDate = newDisplayDate;
    this.orderDate = moment(newDisplayDate).subtract(1, 'days').toDate();

    let today = moment().startOf('day');
    let diff = today.diff(moment(this.orderDate), 'days');
    if (diff == 0) {
      this.orderDateNote = " - הזמנות למחר";
      this.allowEdit = true;
    } else if (diff < 0) {
      this.orderDateNote = " - הזמנות עתידיות";
      this.allowEdit = true;
    } else if (diff > 0 && diff<=1) {
      this.orderDateNote = " - היום";
      this.allowEdit = true;
    } else if (diff > 1) {
      this.orderDateNote = " - הזמנות עבר";
      this.allowEdit = false;
    }
    this.onMonthChange({ 'month': this.orderDate.getMonth() + 1, 'year': this.orderDate.getFullYear() });
  }

  constructor(private statusesService: StatusesService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private ordersService: OrdersService,
    private productService: ProductService,
    private alertService: AlertService,
    private groupService: GroupService,
    private confirmationService: ConfirmationService,
    private config: NgbDropdownConfig,
    private docs: DocsService,
    private spinner: NgxSpinnerService,
    private clientService: ClientService) {

    moment.locale('en-il');

    this.gridOptions = <GridOptions>{
    };
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";

    config.placement = 'top-left';

    this.gridOptions2 = <GridOptions>{
      frameworkComponents: {
        agColorSelect: AgColorSelectComponent
      }
    };
    //this.gridOptions2.domLayout = 'autoHeight'
    this.context = { componentParent: this };

    this.columnDefs = [
      {
        headerName: "סיבוב", field: "cycle", width: 95, cellClass: "header-bold", headerClass: "header-cell", editable: false,
        colSpan: function (params) {
          if (params.data.colSpan) {
            return params.data.colSpan;
          } else {
            return 1;
          }
        },
        cellStyle: function (params) {
          if (params.data.cellStyle) {
            return params.data.cellStyle;
          } else {
            return null;
          }
        }
      },
      {
        headerName: "מוכן בשעה", field: "ready_time", width: 65, cellClass: "header-bold", headerClass: "header-cell", editable: false,
        cellRenderer: function (params) {
          if (params.value) {
            let time = params.value;
            return time.slice(0, -3);
          }
        }
      }
    ];

    this.columnDefs2 = [
      {
        headerName: "&#x2714;", width: 45, cellClass: "cell-center center", editable: false, checkboxSelection: true,
        headerCheckboxSelection: true,
        suppressSorting: true,
        pinned: 'right',
        suppressMenu: true,
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        },
        cellRenderer: params => {
          return null;
        },
      },
      {
        headerName: "סטטוס", field: "status", cellClass: "center", width: 60, editable: true,
        headerClass: "header-cell",
        cellEditor: 'select',
        pinned: 'right',
        suppressSorting: true,
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        },
      },
      {
        headerName: "קבוצה", field: "group", width: 78,
        headerClass: "header-cell",
        pinned: 'right',
        cellStyle: function (params) {
          if (params.value) {
            return { backgroundColor: params.value.color };
          } else {
            return null;
          }
        }, comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
          const genreA = valueA.name.toUpperCase();
          const genreB = valueB.name.toUpperCase();

          let comparison = 0;
          if (genreA > genreB) {
            comparison = 1;
          } else if (genreA < genreB) {
            comparison = -1;
          }
          return comparison;
        },
        cellRenderer: params => {
          return params.value.name;
        },
        editable: false,
        cellEditor: "agColorSelect"
      },
      {
        headerName: 'מ"ק', field: "client.group_order", width: 40, cellClass: "center",
        headerClass: "header-cell",
        pinned: 'right',
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        }
      },
      {
        headerName: "שם הלקוח", field: "client.name", width: 174, editable: false, rowDrag: false, suppressFilter: true, suppressSorting: true,
        headerClass: "header-cell",
        pinned: 'right',
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        }
      },
      {
        headerName: "איש קשר", field: "client.contact_person", width: 80, editable: false, suppressFilter: true, suppressSorting: true,
        headerClass: "header-cell",
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        }
      },
      {
        headerName: "טלפון", field: "client.phone", width: 103, cellClass: "center", editable: false, suppressFilter: true, suppressSorting: true,
        headerClass: "header-cell",
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }
          return style;
        }
      },
      {
        headerName: "שעת אספקה", field: "supply_time", width: 80, cellClass: "center", editable: true,
        headerClass: "header-cell",
        cellStyle: function (params) {
          let style = { backgroundColor: "", fontWeight:'inherit' };
          if (params.data.cellStyle) {
            style += Object.assign(style, params.data.cellStyle);
          }
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          }

          let isDifferent = true;
          if (params.data.client.default_time1 == params.value){
            isDifferent = false;
          }else if(params.data.client.default_time2 == params.value){
            isDifferent = false;
          }else if(params.data.client.default_time3 == params.value){
            isDifferent = false;
          }

          if (isDifferent){
            style.fontWeight='bold';
          }

          return style;
        }
      }
    ];
  }

  onDateChange(newDisplayDate: Date) {
    this.OrderDisplayDate = newDisplayDate;
    this.orderDate = moment(this.orderDate).toDate();
    this.clearTable();
    this.ordersService.getOrderByDate(this.orderDate).subscribe(
      data => {
        if (data.order_date) {
          this.order_id = data.order_id;
          this.loadOrder(null);
        } else {
          this.headerTableCalc();
          this.tableCalc();
          this.order_id = 0;
        }
      }
    );
    //this.setGridEdit(this.allowEdit);
  }

  onMonthChange(event) {
    this.ordersService.getActiveDates(event.month, event.year).subscribe(
      data => {
        this.activeDates = [];
        for (let i = 0; i < data.length; i++) {
          this.activeDates.push(moment(data[i].order_date).toDate());
        }
      }
    );
  }

  colorDate(calendarDate) {
    let date = moment(calendarDate).startOf('day');
    for (let i = 0; i < this.activeDates.length; i++) {
      let xDate = moment(this.activeDates[i]).startOf('day');
      if (date.diff(xDate, 'days') == 1){
        let compare = date.diff(moment().add(-1, 'days').startOf('day'), 'days');
        if (compare == 1){ // today
          return '#60d4f7';
        }else if (compare > 1){
          return '#fbc13f';
        }else if (compare < 1){
          return '#7cc67c';
        }
      }
    }
    return 'inherit';
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

    for (let k = 0; k < this.products.length; k++) {
      for (let i = 0; i < this.columnDefs2.length; i++) {
        if (this.columnDefs2[i].field == "product" + this.products[k].product_id) {
          this.columnDefs2[i].editable = state;
        }
      }
    }
    this.columnDefs2[1].editable = state;
    this.gridApi2.setColumnDefs(this.columnDefs2);
  }

  clearTable() {
    this.gridApi.stopEditing(false);
    for (let i = 0; i < this.headerData.length; i++) {
      for (let k = 0; k < this.products.length; k++) {
        this.headerData[i]["product" + this.products[k].product_id] = "";
      }
    }
    this.gridApi.setRowData(this.headerData);

    this.gridApi2.stopEditing(false);
    this.tableData = [];
    this.fillNewOrder();
  }

  clearTableConfirm() {
    this.confirmationService.confirm({
      message: 'האם אתה בטוח שברצונך לנקות טבלה?',
      header: 'אישור',
      icon: 'fa fa-question-circle',
      accept: () => {
        this.clearTable();
      }
    });
  }

  private buildHeaderTable() {
    this.headerData = [];
    for (let i = 0; i < this.cycles.length; i++) {
      this.headerData.push({ cycle: this.cycles[i].name, ready_time: this.cycles[i].cycle_time, cellStyleRow: { backgroundColor: '#ffc1074a', userSelect: 'text' } });
    }
    this.headerData.push({ cycle: 'סה"כ הזמנות', colSpan: 2, disableEdit: true, cellStyle: { left: 'auto', borderTop: '3px solid darkgrey;' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text', borderTop: '3px solid darkgrey;' } });
    this.headerData.push({ cycle: "מספר השקיות", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto', color: "#0000d0" }, cellStyleRow: { backgroundColor: '#ccccccbd', color: "#0000d0", userSelect: 'text', fontWeight: 'bold' } });
    this.headerData.push({ cycle: "כמות בתפזורת", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });

    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width + 6;

      for (let i = 0; i < this.cycles.length; i++) {
        let value = this.summaryItems.find(e => e.cycle_id == this.cycles[i].cycle_id && e.product_id == this.products[k].product_id);
        this.headerData[i]["product" + this.products[k].product_id] = (value != null) ? value.quantity : '';
      }

      if (!this.headerBuilt) {
        this.columnDefs.push({
          headerName: this.products[k].name,
          field: "product" + this.products[k].product_id,
          cellClass: "center-cell",
          headerClass: "header-cell",
          editable: function (params) {
            if (params.data.disableEdit) return false;
            return true;
          },
          width: colWidth,
          cellStyle: function (params) {
            if (params.data.cellStyleRow) {
              let styles: any = {};
              Object.assign(styles, params.data.cellStyleRow);
              if (params.data.disableEdit) {
                styles.direction = 'ltr';
              }
              if (params.value != "" && !params.data.disableEdit) styles.backgroundColor = "";
              return styles;
            } else {
              return null;
            }
          }
        });

        this.gridApi.setColumnDefs(this.columnDefs);
      }
    }
    this.calcGridWidth();
    this.headerBuilt = true;
  }

  private buildTable() {
    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width + 6;

      this.columnDefs2.push({
        headerName: this.products[k].name,
        field: "product" + this.products[k].product_id,
        editable: function (params) {
          if (params.data.disableEdit) return false
          let price = params.data.client.prices.find(p => p.product.name == params.colDef.headerName);
          if (price.price == null) return false;
          return true;
        },
        suppressSorting: true,
        suppressFilter: true,
        headerClass: "header-cell",
        cellClass: "center-cell",
        width: colWidth, cellStyle: function (params) {
          let style = { backgroundColor: "", border: "" };
          if (params.data.cellStyleRow) {
            style += Object.assign(style, params.data.cellStyleRow);
          }
          let price = params.data.client.prices.find(p => p.product.name == params.colDef.headerName);
          if (params.data.colorRow) {
            style.backgroundColor = "#97d2fb";
          } else if (params.data.disableEdit || price.price == null) {
            style.backgroundColor = "#d9d9d9";
          }
          if (price.package_enabled) {
            style.border = "1px solid #0000d0";
          }
          return style;
        }
      });
    }

    this.gridApi2.setColumnDefs(this.columnDefs2);
    this.calcGridWidth();

  }

  headerTableCellValueChanged(params) {
    if (isNaN(+params.value)) {
      params.data[params.colDef.field] = null;
    }
    params.context.componentParent.headerTableCalc();
  }

  tableCellValueChanged(params) {
    if (params.colDef.field != 'status' && params.colDef.field != 'supply_time' && params.colDef.field != 'group') {
      let value = +params.value;
      if (isNaN(value)) {
        params.data[params.colDef.field] = null;
      } else {
        let price = params.data.client.prices.find(p => p.product.name == params.colDef.headerName);
        if (price.package_enabled) {
          if (value % price.product.package != 0) {
            this.alertService.error("מספר חייב להתחלק ב-" + price.product.package);
            params.data[params.colDef.field] = null;
          }
        }
      }
    }

    params.context.componentParent.tableCalc();
  }

  tableCalc() {
    let rowOffset = this.cycles.length;

    for (let k = 0; k < this.products.length; k++) {
      let colSum = 0;
      let colSumPackage = 0;
      for (let i = 0; i < this.tableData.length; i++) {
        if (this.tableData[i].status == this.statuses[1]) { //printed
          this.tableData[i].disableEdit = true;
          this.tableData[i].colorRow = true;
        } else {
          this.tableData[i].disableEdit = false;
          this.tableData[i].colorRow = false;
        }
        let quantity = +this.tableData[i]["product" + this.products[k].product_id];
        if (!isNaN(quantity)) {
          colSum += quantity;
          let price = this.tableData[i].client.prices.find(x => x.product.product_id == this.products[k].product_id);
          if (price.package_enabled) {
            colSumPackage += quantity / this.products[k].package;
          }
        }

      }
      if (colSum > 0) this.headerData[rowOffset]["product" + this.products[k].product_id] = colSum;
      if (colSumPackage > 0) this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = colSumPackage;
      let tifzoret = colSum - colSumPackage * this.products[k].package;
      if (tifzoret > 0) this.headerData[rowOffset + 2]["product" + this.products[k].product_id] = tifzoret;
    }
    this.headerTableCalc();
    this.gridApi2.setRowData(this.tableData);
  }

  headerTableCalc() {
    // let rowOffset = this.cycles.length;
    // for (let k = 0; k < this.products.length; k++) {
    //   this.headerData[rowOffset]["product" + this.products[k].product_id] = 0;
    //   //this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = 0;
    //   for (let i = 0; i < this.cycles.length; i++) {
    //     this.headerData[rowOffset]["product" + this.products[k].product_id] += +this.headerData[i]["product" + this.products[k].product_id];
    //   }

    //   if (isNaN(+this.headerData[rowOffset + 1]["product" + this.products[k].product_id])) this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = 0;
    //   this.headerData[rowOffset + 2]["product" + this.products[k].product_id] = this.headerData[rowOffset]["product" + this.products[k].product_id] - this.headerData[rowOffset + 1]["product" + this.products[k].product_id];
    // }
    this.gridApi.setRowData(this.headerData);
  }

  showAddItem() {
    this.displayAddClientDialog = true;
  }

  addItem(client: Client) {
    this.displayAddClientDialog = false;
    let row = {
      index: this.index++,
      status: this.statuses[0],
      group: this.groups.find(e => client.group_id == e.group_id),
      client: client,
      supply_time: client.default_time1,
      invoice_number: 0
    }

    this.tableData.push(row);

    this.tableData.sort((a, b) => {
      if (a.group.group_id < b.group.group_id) return -1;
      if (a.group.group_id > b.group.group_id) return 1;

      if (a.client.group_order < b.client.group_order) return -1;
      if (a.client.group_order > b.client.group_order) return 1;
      return 0;
    });

    this.gridApi2.setRowData(this.tableData);
    this.alertService.success("שורה נוספה בהצלחה");
  }

  deleteRows() {
    this.confirmationService.confirm({
      message: 'האם אתה בטוח שברצונך למחוק שורות?',
      header: 'אישור מחיקה',
      icon: 'fa fa-question-circle',
      accept: () => {
        let counter = 0;
        let skipped = false;
        let todelete = [];
        for (let i = 0; i < this.tableData.length; i++) {
          let row: any = this.gridApi2.getModel().getRow(i);
          if (row.selected) {
            if (!this.isLineHasProducts(i)) {
              todelete.push(i);
              //this.tableData.splice(i, 1);
              counter++;
            } else {
              skipped = true;
            }
          }
        }

        for (var i = todelete.length - 1; i >= 0; i--) {

          this.tableData.splice(todelete[i], 1);

        }

        if (skipped) {
          this.alertService.success(counter + " שורות נמחקו");
          this.alertService.warning("לא כל השורות נמחקו. יש שורות עם תוכן");
        } else {
          this.alertService.success(counter + " שורות נמחקו");
        }

        this.gridApi2.setRowData(this.tableData);
      }
    });

  }

  onGridReady(params) {
    this.gridApi = params.api;

    Observable.forkJoin(
      this.statusesService.getCycles(),
      this.productService.getAll(),
      this.groupService.getAll(),
      this.clientService.getAll(),
      this.statusesService.getStatuses()
    ).subscribe(
      data => {
        this.cycles = data[0];
        this.products = data[1];
        this.groups = data[2];
        this.clients = data[3];
        this.activeClients = this.clients.filter(x=>x.active);
        this.statuses = data[4];

        this.columnDefs2.find(x => x.field == "status").cellEditorParams = { values: this.statuses };
        this.gridApi2.setColumnDefs(this.columnDefs2);

        let clients_counter = 0;
        for (let i = 0; i < this.clients.length; i++) {
          this.clientService.getPricesByClientId(this.clients[i].client_id).subscribe(
            prices => {
              this.clients[i].prices = [];
              for (let k = 0; k < this.products.length; k++) {
                let price = prices.find(p => p.product_id == this.products[k].product_id);
                //this.clients[i].prices.push(new Price(this.products[k], (price) ? price.price : null));

                if (price) {
                  this.clients[i].prices.push(new Price(this.products[k], price.price, null, (price.package_enabled) ? 1 : 0));
                } else {
                  this.clients[i].prices.push(new Price(this.products[k], null, null, 0));
                }

              };
              clients_counter++;
              if (clients_counter == this.clients.length) {
                this.buildTable();

                if (!isNaN(this.order_id)) {
                  this.loadOrder(null);
                } else {
                  this.buildHeaderTable();
                  this.fillNewOrder();
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

  onGridReady2(params) {
    this.gridApi2 = params.api;
  }

  loadOrder(onComplete: () => void) {
    this.spinner.show();
    this.tableData = [];
    this.headerData = [];

    Observable.forkJoin(
      this.ordersService.getByCriteria(this.order_id),
      this.ordersService.getOrderProducts(this.order_id),
      this.ordersService.getSummaryItemsById(this.order_id),
    ).subscribe(
      data => {
        this.orderLines = data[0];
        this.orderProducts = data[1];
        this.summaryItems = data[2];
        this.buildHeaderTable();

        if (this.orderLines.length > 0) {
          for (let i = 0; i < this.orderLines.length; i++) {
            this.orderLines[i].client = this.clients.find(e => e.client_id == this.orderLines[i].client_id);
            let row = {
              index: this.index++,
              index_id: this.orderLines[i].index_id,
              status: this.statuses[this.orderLines[i].status_id],
              group: this.groups.find(e => this.orderLines[i].group_id == e.group_id),
              client: this.orderLines[i].client,
              supply_time: this.orderLines[i].supply_time,
              invoice_number: this.orderLines[i].invoice_number
            }

            let products = this.orderProducts.filter(e => e.index_id == this.orderLines[i].index_id);
            for (let k = 0; k < products.length; k++) {
              row["product" + products[k].product_id] = products[k].quantity;
            }

            this.tableData.push(row);
          }
        } else {
          this.fillNewOrder();
        }

        this.gridApi.setRowData(this.headerData);
        this.gridApi2.setRowData(this.tableData);
        this.headerTableCalc();
        this.tableCalc();
        if (onComplete != null) onComplete();
        this.spinner.hide();
      },
      err => {
        this.spinner.hide();
        console.error(err);
      }
    );

  }

  fillNewOrder() {
    this.tableData = [];
    for (let i = 0; i < this.activeClients.length; i++) {
      this.tableData.push({ invoice_number: 0, select: false, status: this.statuses[0], group: this.groups.find(e => this.activeClients[i].group_id == e.group_id), client: this.activeClients[i], supply_time: this.activeClients[i].default_time1 });
      if (this.activeClients[i].default_time2) {
        this.tableData.push({ invoice_number: 0, select: false, status: this.statuses[0], group: this.groups.find(e => this.activeClients[i].group_id == e.group_id), client: this.activeClients[i], supply_time: this.activeClients[i].default_time2 });
      }
      if (this.activeClients[i].default_time3) {
        this.tableData.push({ invoice_number: 0, select: false, status: this.statuses[0], group: this.groups.find(e => this.activeClients[i].group_id == e.group_id), client: this.activeClients[i], supply_time: this.activeClients[i].default_time3 });
      }
    }
    this.gridApi2.setRowData(this.tableData);
  }

  calcGridWidth() {    
    let screenWidth = document.documentElement.clientWidth;
    let screenHeight = document.documentElement.clientHeight;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 2;
    //this.headerTableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };
    this.headerTableStyle = { width: newWidth + 'px' };
    this.gridApi.doLayout();

    newWidth = 0;
    for (let i = 0; i < this.columnDefs2.length; i++) {
      newWidth += this.columnDefs2[i].width;
    }
    newWidth += 20;
    //this.tableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };
    let newHeight = screenHeight - 430;
    //this.tableStyle = { width: newWidth + 'px', height: newHeight + 'px',
    this.maxWidth = newWidth;
    this.tableStyle = { width:'100%', height: newHeight + 'px', maxWidth:  newWidth + 'px',
    boxSizing: 'border-box' };
    
    this.gridApi2.doLayout();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.order_id = +params['id'];
      var action = params['action'];
      if (isNaN(this.order_id)) {
        let today = moment().startOf('day').add(-1, 'days').toDate(); //today
        this.ordersService.createOrderId(today).subscribe(data => {
          this.orderDate = moment(data.order_date).toDate();
          this.order_id = data.order_id;
          this.OrderDisplayDate = moment(this.orderDate).add(1, 'days').toDate();
        }
        );
      } else {
        this.ordersService.getOrderById(this.order_id).subscribe(
          data => {
            this.orderDate = moment(data.order_date).toDate();
            this.order_id = data.order_id;
            this.OrderDisplayDate = moment(this.orderDate).add(1, 'days').toDate();
          },
          err => {
            this.alertService.error(err.error);
          });
      }

    });
  }

  copyToToday() {
    this.ordersService.createOrderId(new Date()).subscribe(data => {
      this.orderDate = moment(data.orderDate).toDate();
      this.order_id = data.order_id;
      //this.saveOrder(null);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  saveOrder(onComplete: () => void) {
    this.saving = true;
    this.spinner.show();
    this.gridApi.stopEditing(false);
    this.gridApi2.stopEditing(false);

    // if (this.order_id == 0) {
    //   this.ordersService.createOrderId(this.orderDate).subscribe(
    //     data => {
    //       this.orderDate = moment(data.order_date).toDate();
    //       this.order_id = data.order_id;
    //     });
    // }

    //save summary
    let summary: OrderSummaryItem[] = [];
    for (let i = 0; i < this.cycles.length; i++) {
      for (let k = 0; k < this.products.length; k++) {
        let quantity = +this.headerData[i]["product" + this.products[k].product_id];
        if (!isNaN(quantity) && quantity != 0) {
          let item = new OrderSummaryItem();
          item.cycle_id = this.cycles[i].cycle_id;
          item.order_id = this.order_id;
          item.product_id = this.products[k].product_id;
          item.quantity = quantity;
          summary.push(item);
        }
      }
    }

    if (summary.length > 0) {
      this.ordersService.saveSummaryItems(summary).subscribe();
    }

    //save order lines
    let orderLines: Order[] = [];
    for (let i = 0; i < this.tableData.length; i++) {
      let row = this.gridApi2.getModel().getRow(i).data;
      let order = new Order();
      order.client_id = row.client.client_id;
      order.group_id = row.group.group_id;
      order.index_id = row.index_id;
      order.order_id = this.order_id;
      order.sort_order = i;
      order.status_id = this.statuses.findIndex(e => e == row.status);
      order.supply_time = row.supply_time;
      order.invoice_number = row.invoice_number;
      orderLines.push(order);
    }

    this.ordersService.saveOrderLines(orderLines).subscribe(
      data => {
        let index_id = data;

        let orderProducts: OrderItem[] = [];
        for (let i = 0; i < this.tableData.length; i++) {
          for (let k = 0; k < this.products.length; k++) {
            let quantity = +this.tableData[i]["product" + this.products[k].product_id];
            if (!isNaN(quantity) && quantity != 0) {
              let item = new OrderItem();
              item.index_id = index_id[i];
              item.order_id = this.order_id;
              item.product_id = this.products[k].product_id;
              item.quantity = quantity;
              let client = this.tableData[i].client;
              item.price = client.prices.find(p => p.product.product_id == this.products[k].product_id).price;
              orderProducts.push(item);
            }
          }
        }
        this.ordersService.saveOrderProducts(orderProducts).subscribe(
          data => {
            this.alertService.success("רשומה עודכנה בהצלחה");
            this.saving = false;
            this.spinner.hide();

            if (onComplete != null) onComplete();
          }
        );
      },
      err => {
        this.saving = false;
        this.spinner.hide();
      }
    );
  }

  saveWithReload(onComplete: () => void) {
    if (this.order_id == 0) {
      this.ordersService.createOrderId(this.orderDate).subscribe(
        data => {
          this.orderDate = moment(data.order_date).toDate();
          this.order_id = data.order_id;

          this.saveOrder(() => {
            this.clearTable();
            this.loadOrder(() => {
              if (onComplete != null) onComplete();
            });
          });
        });
    }else{
      this.saveOrder(() => {
        this.clearTable();
        this.loadOrder(() => {
          if (onComplete != null) onComplete();
        });
      });
    }    
  }

  isLineHasProducts(index) {
    for (let k = 0; k < this.products.length; k++) {
      let quantity = +this.tableData[index]["product" + this.products[k].product_id];
      if (!isNaN(quantity) && quantity != 0) {
        return true;
      }
    }
    return false;
  }

  printRows() {    
    let rows = this.gridApi2.getSelectedRows();
    if (rows.length == 0) {
      this.alertService.error("נא לסמן שורות לפני ההדפסה");
      return;
    }
    let indecies: { index, index_id, invoice }[] = [];

    for (let i = 0; i < this.tableData.length; i++) {
      if (this.isLineHasProducts(i)) {
        let row: any = this.gridApi2.getModel().getRow(i);
        if (row.selected) {
          row.data.status = this.statuses[1];
          indecies.push({ index: i, index_id: row.data.index_id, invoice: row.data.invoice_number });
        }
      }
    }

    if (indecies.length == 0) {
      this.alertService.error("אין שורות עם תוכן. אין מה להדפיס");
      return;
    }

    this.saveWithReload(() => {
      for (let i = 0; i < indecies.length; i++) {
          let row: any = this.gridApi2.getModel().getRow(indecies[i].index);
          indecies[i].index_id = row.data.index_id;
          indecies[i].invoice = row.data.invoice_number;
      }

      var complete = 0;
      for (let i = 0; i < indecies.length; i++) {
        let row: any = this.gridApi2.getModel().getRow(indecies[i].index);

        if (row.data.invoice_number == 0) {
          this.ordersService.updateInvoice(indecies[i].index_id).subscribe(
            data => {
              this.tableData.find(x => (x.index_id == data.index_id)).invoice_number = data.invoice_number;
              //row.data.invoice_number = invoice_number;
              complete++;
              if (complete == indecies.length) {
                this.completePrint(indecies);
              }
            }
          );
        } else {
          complete++;
          if (complete == indecies.length) {
            this.completePrint(indecies);
          }
        }
      }
    });
  }


  completePrint(indecies) {
    // if (this.allowEdit) {
    //   this.saveWithReload(() => {
    //     this.docs.getPackingLists(this.order_id, indecies.map(a => a.index));
    //   });
    // } else {
      this.docs.getPackingLists(this.order_id, indecies.map(a => a.index));
    //}
  }
}