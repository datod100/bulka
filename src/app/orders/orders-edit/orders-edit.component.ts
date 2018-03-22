import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService, GroupService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';
import { Price } from '../../_models/price';


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
  styleUrls: ['./orders-edit.component.css']
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
  groups: Group[] = [];
  summaryItems: OrderSummaryItem[] = [];
  orderLines: Order[] = [];
  orderProducts: OrderItem[] = [];
  statuses: string[] = [];
  isNew: boolean = false;
  title;
  rowSelection;
  public clients: Client[] = [];
  order_id: number;
  orderDate: Date;
  private sub: any;
  index = 0;
  loading = false;
  maxDate = new Date();
  headerBuilt = false;

  constructor(private statusesService: StatusesService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private ordersService: OrdersService,
    private productService: ProductService,
    private alertService: AlertService,
    private groupService: GroupService,
    private clientService: ClientService) {


    this.gridOptions = <GridOptions>{
    };
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";
    this.maxDate.setHours(0, 0, 0, 0);

    this.gridOptions2 = <GridOptions>{
      frameworkComponents: {
        agColorSelect: AgColorSelectComponent
      }
    };
    this.gridOptions2.domLayout = 'autoHeight'
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
        headerName: "&#x2714;", width: 45, cellClass: "cell-center", editable: false, checkboxSelection: true,
        suppressSorting: true,
        suppressMenu: true,
        cellStyle: function (params) {
          if (params.data.cellStyle) {
            return params.data.cellStyle;
          } else {
            return null;
          }
        },
        cellRenderer: params => {
          return null;
        },
      },
      {
        headerName: "סטטוס", field: "status", width: 85, editable: true,
        cellEditor: 'select',
        cellEditorParams: {
          values: ['חדש', 'מוכן', 'נשלח']
        }
      },
      {
        headerName: "קבוצה", field: "group", width: 80,
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
        editable: true,
        cellEditor: "agColorSelect"
      },
      {
        headerName: "שם הלקוח", field: "client.name", width: 180, editable: false, rowDrag: true
      },
      {
        headerName: "איש קשר", field: "client.contact_person", width: 100, editable: false
      },
      {
        headerName: "טלפון", field: "client.phone", width: 110, editable: false
      },
      {
        headerName: "שעת אספקה", field: "supply_time", width: 95, cellClass: "header-bold", editable: true
      }
    ];

  }


  formatDate(unfDate) {
    const [y, m, d] = unfDate.split('-').map((val: string) => +val);
    return new Date(y, m - 1, d);
  }

  onDateChange(newDate: Date) {
    this.clearTable();
    this.isNew = false;
    if (newDate.getTime() == this.maxDate.getTime()) {
      this.isNew = true;
    }
    this.ordersService.getOrderByDate(newDate).subscribe(
      data => {
        if (data.order_date) {
          const [y, m, d] = data.order_date.split('-').map((val: string) => +val);
          this.orderDate = new Date(y, m - 1, d);
          this.order_id = data.order_id;
          this.loadOrder();
        } else {
          this.headerTableCalc();
          this.tableCalc();
        }
      }
    );
    this.setGridEdit(this.isNew);
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
    /*
    for (let i = 0; i < this.tableData.length; i++) {
      for (let k = 0; k < this.products.length; k++) {
        this.tableData[i]["product" + this.products[k].product_id] = "";
      }
    }
    this.gridApi2.setRowData(this.tableData);
    */
  }

  private buildHeaderTable() {
    this.headerData = [];
    for (let i = 0; i < this.cycles.length; i++) {
      this.headerData.push({ cycle: this.cycles[i].name, ready_time: this.cycles[i].cycle_time, cellStyleRow: { backgroundColor: '#ffc1074a', userSelect: 'text' } });
    }
    this.headerData.push({ cycle: "סיכום הזמנות", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });
    this.headerData.push({ cycle: "נשלח", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });
    this.headerData.push({ cycle: "יתרת סחורה במאפייה", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });

    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].width + 12;

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
          width: colWidth, cellStyle: function (params) {
            if (params.data.cellStyleRow) {
              let styles = params.data.cellStyleRow;
              if (params.data.disableEdit) {
                styles.direction = 'ltr';
              }
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
        width: colWidth, cellStyle: function (params) {
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
      if (isNaN(+params.value)) {
        params.data[params.colDef.field] = null;
      }
    }

    params.context.componentParent.tableCalc();
  }

  tableCalc() {
    let rowOffset = this.cycles.length + 1;

    for (let k = 0; k < this.products.length; k++) {
      let colSum = 0;
      for (let i = 0; i < this.tableData.length; i++) {
        if (this.tableData[i].status == "נשלח") {
          let quantity = +this.tableData[i]["product" + this.products[k].product_id];
          this.tableData[i].disableEdit = true;
          if (!isNaN(quantity)) colSum += quantity;
        } else {
          this.tableData[i].disableEdit = false;
        }
      }
      this.headerData[rowOffset]["product" + this.products[k].product_id] = colSum;
    }
    this.headerTableCalc();
    this.gridApi2.setRowData(this.tableData);
  }

  headerTableCalc() {
    let rowOffset = this.cycles.length;
    for (let k = 0; k < this.products.length; k++) {
      this.headerData[rowOffset]["product" + this.products[k].product_id] = 0;
      //this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = 0;
      for (let i = 0; i < this.cycles.length; i++) {
        this.headerData[rowOffset]["product" + this.products[k].product_id] += +this.headerData[i]["product" + this.products[k].product_id];
      }

      if (isNaN(+this.headerData[rowOffset + 1]["product" + this.products[k].product_id])) this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = 0;
      this.headerData[rowOffset + 2]["product" + this.products[k].product_id] = this.headerData[rowOffset]["product" + this.products[k].product_id] - this.headerData[rowOffset + 1]["product" + this.products[k].product_id];
    }
    this.gridApi.setRowData(this.headerData);
  }

  addItem(client: Client) {
    let row = {
      index: this.index++,
      status: this.statuses[0],
      group: this.groups.find(e => client.group_id == e.group_id),
      client: client,
      supply_time: client.default_time1
    }

    this.tableData.push(row);
    this.gridApi2.setRowData(this.tableData);
  }

  deleteRows() {
    let rows = this.gridApi2.getSelectedRows();
    for (let i = 0; i < rows.length; i++) {
      let index = this.tableData.findIndex(e => e.index == rows[i].index);
      this.tableData.splice(index, 1);
    }
    this.gridApi2.setRowData(this.tableData);
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
        this.statuses = data[4];

        let clients_counter = 0;
        for (let i = 0; i < this.clients.length; i++) {
          this.clientService.getPricesByClientId(this.clients[i].client_id).subscribe(
            prices => {
              this.clients[i].prices = [];
              for (let k = 0; k < this.products.length; k++) {
                let price = prices.find(p => p.product_id == this.products[k].product_id);
                this.clients[i].prices.push(new Price(this.products[k], (price) ? price.price : null));
              };
              clients_counter++;
              if (clients_counter == this.clients.length) {
                this.buildTable();

                if (!isNaN(this.order_id)) {
                  this.loadOrder();
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

  loadOrder() {
    this.tableData = [];
    this.headerData = [];
    Observable.forkJoin(
      this.ordersService.getByCriteria(this.order_id),
      this.ordersService.getOrderProducts(this.order_id),
      this.ordersService.getSummaryItemsById(this.order_id)
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
              status: this.statuses[this.orderLines[i].status_id],
              group: this.groups.find(e => this.orderLines[i].group_id == e.group_id),
              client: this.orderLines[i].client,
              supply_time: this.orderLines[i].supply_time
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
      },
      err => console.error(err)
    );

  }

  fillNewOrder() {
    this.tableData = [];
    for (let i = 0; i < this.clients.length; i++) {
      this.tableData.push({ select: false, status: 'חדש', group: this.groups.find(e => this.clients[i].group_id == e.group_id), client: this.clients[i], supply_time: this.clients[i].default_time1 });
      if (this.clients[i].default_time2) {
        this.tableData.push({ select: false, status: 'חדש', group: this.groups.find(e => this.clients[i].group_id == e.group_id), client: this.clients[i], supply_time: this.clients[i].default_time2 });
      }
      if (this.clients[i].default_time3) {
        this.tableData.push({ select: false, status: 'חדש', group: this.groups.find(e => this.clients[i].group_id == e.group_id), client: this.clients[i], supply_time: this.clients[i].default_time3 });
      }
    }
    this.gridApi2.setRowData(this.tableData);
  }

  onGridReady2(params) {
    this.gridApi2 = params.api;
  }

  calcGridWidth() {
    let screenWidth = window.outerWidth;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 2;
    this.headerTableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };
    this.gridApi.doLayout();

    newWidth = 0;
    for (let i = 0; i < this.columnDefs2.length; i++) {
      newWidth += this.columnDefs2[i].width;
    }
    newWidth += 2;
    this.tableStyle = { width: ((newWidth > screenWidth) ? screenWidth - 50 : newWidth) + 'px' };
    this.gridApi2.doLayout();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.order_id = +params['id'];
      var action = params['action'];
      if (isNaN(this.order_id)) {
        this.ordersService.getTodayOrderId().subscribe(data => {
          this.orderDate = this.formatDate(data.order_date);
          this.order_id = data.order_id;
        }
        );
        this.isNew = true;
      } else {
        this.ordersService.getOrderById(this.order_id).subscribe(data => {
          this.orderDate = this.formatDate(data.order_date);
          this.order_id = data.order_id;
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  saveOrder() {
    this.gridApi.stopEditing(false);
    this.gridApi2.stopEditing(false);

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
              orderProducts.push(item);
            }
          }
        }
        this.ordersService.saveOrderProducts(orderProducts).subscribe();
        this.alertService.success("רשומה עודכנה בהצלחה");
      },
      err => { }
    );
  }


}