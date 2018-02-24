import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, Status, OrderItem, Group } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService, GroupService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';


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

  title;
  order: Order;
  public clients: Client[] = [];
  public filteredClients: Client[] = [];
  public collections = [];
  public filteredCollections = [];
  order_id: number;
  private sub: any;
  confirmation_date: Date;
  selectedItem: OrderItem;
  selectedCollection: { name: string; id: number } = { name: null, id: -1 };

  constructor(private statusesService: StatusesService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private ordersService: OrdersService,
    private productService: ProductService,
    private alertService: AlertService,
    private groupService: GroupService,
    private clientService: ClientService) {


    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'

    this.gridOptions2 = <GridOptions>{
      frameworkComponents: {
        agColorSelect : AgColorSelectComponent
      }
    };
    this.gridOptions2.domLayout = 'autoHeight'
    

    this.context = { componentParent: this };
    this.context2 = { componentParent: this };

    this.columnDefs = [
      {
        headerName: "סיבוב", field: "cycle", width: 120, cellClass: "header-bold", editable: false,
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
        headerName: "מוכן בשעה", field: "ready_time", width: 85, cellClass: "header-bold", editable: false,
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
        headerName: "סמן", field: "select", width: 50, cellClass: "header-bold", editable: false,
        cellRenderer: params => {
          return `<input type='checkbox' ${params.value ? 'checked' : ''} />`;
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
        headerName: "סטטוס", field: "status", width: 70, cellClass: "header-bold", editable: false,
        cellRenderer: params => {
          return `<input type='checkbox' ${params.value ? 'checked' : ''} />`;
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
        headerName: "קבוצה", field: "group", width: 120,
        cellStyle: function (params) {
          if (params.value){
            return {backgroundColor:params.value.color};
          } else {
            return null;
          }
        },
        editable: true,
        cellEditor: "agColorSelect",
        cellRenderer : (params)=>{
          if (params.value){
            return params.value.name;
          }
        }
      },
      {
        headerName: "שעת אספקה", field: "supply_time", width: 85, cellClass: "header-bold", editable: false,
        cellRenderer: function (params) {
          if (params.value) {
            let time = params.value;
            return time.slice(0, -3);
          }
        }
      }
    ];

    this.order = new Order();
    this.order.client = new Client();
    this.order.status = new Status();
    this.order.status_id = 2;
    var dt = new Date();
    dt.setUTCFullYear(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());

    this.order.confirmation_date = dt;
    this.order.supply_date = null;
    this.selectedCollection.name = "Ami";
  }

  search(event) {
    this.filteredClients = this.clients.filter(v => v.name.toLowerCase().indexOf(event.query.toLowerCase()) > -1);
  }


  private buildHeaderTable() {
    for (let i = 0; i < this.cycles.length; i++) {
      this.headerData.push({ cycle: this.cycles[i].name, ready_time: this.cycles[i].cycle_time, cellStyleRow: { backgroundColor: '#ffc1074a', userSelect: 'text' } });
    }
    this.headerData.push({ cycle: "סיכום הזמנות", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });
    this.headerData.push({ cycle: "נשלח", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });
    this.headerData.push({ cycle: "יתרת סחורה במאפייה", colSpan: 2, disableEdit: true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd', userSelect: 'text' } });

    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].name.length * 9;

      for (let i = 0; i < this.cycles.length; i++) {
        this.headerData[i]["product" + this.products[k].product_id] = '';
      }

      this.columnDefs.push({
        headerName: this.products[k].name,
        field: "product" + this.products[k].product_id,
        editable: function (params) {
          if (params.data.disableEdit) return false
          return true;
        },
        suppressKeyboardEvent: function (params) {
          ///checkKey(params.event);
        },
        width: (colWidth < 70) ? 70 : colWidth, cellStyle: function (params) {
          if (params.data.cellStyleRow) {
            return params.data.cellStyleRow;
          } else {
            return null;
          }
        }
      });
    }
    this.gridApi.setColumnDefs(this.columnDefs);
    this.calcGridWidth();
    this.gridApi.setRowData(this.headerData);

    this.headerTableCalc();
  }


  private buildTable() {
    this.tableData.push({ select: true, status: false, supply_time: "06:00:00" });
    this.gridApi2.setColumnDefs(this.columnDefs2);
    this.calcGridWidth();
    this.gridApi2.setRowData(this.tableData);

  }

  headerTableCellValueChanged(params) {
    if (isNaN(+params.value)) {
      params.data[params.colDef.field] = null;
    }
    params.context.componentParent.headerTableCalc();
  }

  headerTableCalc() {
    let rowOffset = this.cycles.length;
    for (let k = 0; k < this.products.length; k++) {
      this.headerData[rowOffset]["product" + this.products[k].product_id] = 0;
      this.headerData[rowOffset + 1]["product" + this.products[k].product_id] = 0;
      for (let i = 0; i < this.cycles.length; i++) {
        this.headerData[rowOffset]["product" + this.products[k].product_id] += +this.headerData[i]["product" + this.products[k].product_id];
      }

      this.headerData[rowOffset + 2]["product" + this.products[k].product_id] = this.headerData[rowOffset]["product" + this.products[k].product_id] - this.headerData[rowOffset + 1]["product" + this.products[k].product_id];
    }
    this.gridApi.setRowData(this.headerData);
  }

  onGridReady(params) {
    this.gridApi = params.api;

    Observable.forkJoin(
      this.statusesService.getCycles(),
      this.productService.getAll(),
      this.groupService.getAll()
    ).subscribe(
      data => {
        this.cycles = data[0];
        this.products = data[1];
        this.groups = data[2];

        this.buildHeaderTable();

      },
      err => console.error(err),
      () => {
        if (this.order_id) {
          this.title = "Edit";

          Observable.forkJoin(
            this.ordersService.getById(this.order_id),
            this.ordersService.getItemsById(this.order_id)
          ).subscribe(
            data => {
              this.order = data[0][0];
              this.order.items = data[1];
              this.order.client = this.clients.find(item => item.client_id === this.order.client_id);
              if (this.order.confirmation_date) this.order.confirmation_date = new Date(this.order.confirmation_date);
              if (this.order.supply_date) this.order.supply_date = new Date(this.order.supply_date);
            },
            err => console.error(err)
          );

        } else {
          this.title = "Create";
        }

      }
    );

    //params.api.sizeColumnsToFit();
    //this.gridApi.resetRowHeights();
  }

  onGridReady2(params) {
    this.gridApi2 = params.api;

    Observable.forkJoin(
      this.clientService.getAll()
    ).subscribe(
      data => {
        this.clients = data[0];

        this.buildTable();

      },
      err => console.error(err),
      () => {
        if (this.order_id) {
          this.title = "Edit";

          Observable.forkJoin(
            this.ordersService.getById(this.order_id),
            this.ordersService.getItemsById(this.order_id)
          ).subscribe(
            data => {
              this.order = data[0][0];
              this.order.items = data[1];
              this.order.client = this.clients.find(item => item.client_id === this.order.client_id);
              if (this.order.confirmation_date) this.order.confirmation_date = new Date(this.order.confirmation_date);
              if (this.order.supply_date) this.order.supply_date = new Date(this.order.supply_date);
            },
            err => console.error(err)
          );

        } else {
          this.title = "Create";
        }

      }
    );

  }

  private calcGridWidth() {
    let screenWidth = window.outerWidth;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 2;
    this.headerTableStyle = { width: ((newWidth > screenWidth) ? screenWidth : newWidth) + 'px' };
    this.gridApi.doLayout();

    newWidth = 0;
    for (let i = 0; i < this.columnDefs2.length; i++) {
      newWidth += this.columnDefs2[i].width;
    }
    newWidth += 2;
    this.tableStyle = { width: ((newWidth > screenWidth) ? screenWidth : newWidth) + 'px' };
    this.gridApi2.doLayout();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.order_id = +params['id'];
      var action = params['action'];

    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  save(navigateOff) {
    this.order.client_id = this.order.client.client_id;
    this.order.status_id = this.order.status.status_id;

    if (this.order.order_id) {
      this.ordersService.update(this.order).subscribe(
        data => { },
        err => { },
        () => {
          this.router.navigate(["/orders"]);
        }
      );
    } else {
      this.ordersService.create(this.order).subscribe(
        data => {
          if (navigateOff) {
            this.router.navigate(["/orders"]);
          } else {
            this.router.navigate(["/orders/edit/" + data + "/AddItem"]);
          }
        },
        err => {
          this.alertService.error(err.message);
        },
        () => {
        }
      );
    }

  }
}
