import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, OrderItem, Group, OrderSummaryItem, RefundItem } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService, ProductService, GroupService, RefundsService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { GridOptions, SelectCellEditor } from "ag-grid/main";
import { AgColorSelectComponent } from '../../_helpers/ag-color-select/ag-color-select.component';

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
  refundLines: RefundItem[];
  sub;
  isNew = false;

  constructor(private statusesService: StatusesService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private refundsService: RefundsService,
    private productService: ProductService,
    private alertService: AlertService,
    private groupService: GroupService,
    private clientService: ClientService) {

    this.gridOptions = <GridOptions>{};
    this.gridOptions.domLayout = 'autoHeight'
    this.rowSelection = "multiple";
    this.context = { componentParent: this };

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

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.refund_id = +params['id'];
      var action = params['action'];
      if (isNaN(this.refund_id)) {
        this.refundsService.getTodayRefundId().subscribe(refund_id => this.refund_id = refund_id);
        this.isNew = true;
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

        this.buildTable();

        if (!isNaN(this.refund_id)) {
          this.loadOrder();
        } else {
          //this.fillNewOrder();
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
      let colWidth = this.products[k].name.length * 9;

      this.columnDefs.push({
        headerName: this.products[k].name,
        field: "product" + this.products[k].product_id,
        editable: function (params) {
          if (params.data.disableEdit) return false
          return true;
        },
        width: (colWidth < 80) ? 80 : colWidth, cellStyle: function (params) {
          if (params.data.cellStyleRow) {
            return params.data.cellStyleRow;
          } else {
            return null;
          }
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


}
