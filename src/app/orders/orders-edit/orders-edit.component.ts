import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, Status, OrderItem } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions } from "ag-grid/main";

@Component({
  selector: 'app-orders-edit',
  templateUrl: './orders-edit.component.html',
  styleUrls: ['./orders-edit.component.css']
})

export class OrdersEditComponent implements OnInit, OnDestroy {

  gridOptions: GridOptions;
  columnDefs: any[]
  private context;
  private frameworkComponents;
  private gridApi: GridApi;

  headerData = [];
  products = [];
  cycles = [];
  headerTableStyle;
  defaultColDef;

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
    private clientService: ClientService) {


    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'

    this.context = { componentParent: this };
    this.frameworkComponents = {
    };

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
      this.headerData.push({ cycle: this.cycles[i].name, ready_time: this.cycles[i].cycle_time, cellStyleRow: { backgroundColor: '#ffc1074a' } });
    }
    this.headerData.push({ cycle: "סיכום הזמנות", colSpan: 2, disableEdit:true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd' } });
    this.headerData.push({ cycle: "נשלח", colSpan: 2,disableEdit:true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd' } });
    this.headerData.push({ cycle: "יתרת סחורה במאפייה", colSpan: 2,disableEdit:true, cellStyle: { left: 'auto' }, cellStyleRow: { backgroundColor: '#ccccccbd' } });

    for (let k = 0; k < this.products.length; k++) {
      let colWidth = this.products[k].name.length * 9;

      for (let i = 0; i < this.cycles.length; i++) {
        this.headerData[i]["product"+this.products[k].product_id]='';
      }

      this.columnDefs.push({
        headerName: this.products[k].name,
        field: "product"+this.products[k].product_id,
        editable: function(params){
          if (params.data.disableEdit) return false
          return true;
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
    
  }


  onGridReady(params) {
    this.gridApi = params.api;

    Observable.forkJoin(
      this.clientService.getAll(),
      this.statusesService.getCycles(),
      this.productService.getAll()
    ).subscribe(
      data => {
        this.clients = data[0];
        this.cycles = data[1];
        this.products = data[2];

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

  private calcGridWidth() {
    let newWidth = 0;
    let screenWidth = window.outerWidth;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 2;

    this.headerTableStyle = { width: ((newWidth > screenWidth) ? screenWidth : newWidth) + 'px' };
    this.gridApi.doLayout();
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
