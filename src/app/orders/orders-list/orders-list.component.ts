import { Component, OnInit } from '@angular/core';
import { Order, Client, OrderItem } from '../../_models/index';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { environment } from '../../../environments/environment';
import { OrdersService, StatusesService, ClientService } from '../../_services/index';
import { NgbModal, NgbActiveModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { OrdersEditComponent } from '../../orders/orders-edit/orders-edit.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { GridOptions } from "ag-grid/main";
import { forEach } from '@angular/router/src/utils/collection';
import { OrdersListGridComponent } from '../orders-list-grid/orders-list-grid.component';
import { GridApi } from 'ag-grid/dist/lib/gridApi';
import { sprintf } from 'sprintf-js';
import { RowNode } from 'ag-grid/dist/lib/entities/rowNode';
import { Router } from '@angular/router';

@Component({
    selector: 'app-orders-list',
    templateUrl: './orders-list.component.html',
    styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit {
    orders: Order[] = [];
    statuses = [];
    clients: Client[] = [];
    closeResult: string;
    gridOptions: GridOptions;
    columnDefs: any[]
    private context;
    private frameworkComponents;
    private gridApi: GridApi;
    private rowSelection;
    private getRowHeight;
    rowHeight = 25;

    constructor(private ordersService: OrdersService,
        private clientService: ClientService,
        private router: Router,
        private statusesService: StatusesService,
        private modalService: NgbModal) {

        this.gridOptions = <GridOptions>{};
        this.gridOptions.rowHeight = this.rowHeight;
        this.gridOptions.domLayout = 'autoHeight'

        this.context = { componentParent: this };
        this.frameworkComponents = {
            squareRenderer: OrdersListGridComponent,
        };

        this.rowSelection = "single";
        this.statusesService.getStatuses().subscribe(statuses => { this.statuses = statuses; });
        this.clientService.getAll().subscribe(clients => { this.clients = clients; });

        this.columnDefs = [
            {
                headerName: "#", field: "confirmation_number", width: 70, suppressSizeToFit: true, cellClass: 'center-cell', sortingOrder: ["desc", "asc"],
            },
            {
                headerName: "", field: "proform_number", width: 35, suppressSizeToFit: true, cellClass: 'center-cell',
                cellRenderer: function (params) {
                    if (params.value != null) {
                        return "<i class='fa fa-check-circle text-success' title='" + params.value + "'></i>";
                    }
                    return "";
                }
            },
            {
                headerName: "Order Date", field: "confirmation_date", width: 105, suppressSizeToFit: true, cellClass: 'center-cell', sortingOrder: ["desc", "asc"],
                cellRenderer: function (params) {
                    var date = new Date(params.value);
                    return ('0' + date.getDate()).slice(-2) + '/'
                        + ('0' + date.getMonth()).slice(-2) + '/'
                        + date.getFullYear();
                }
            },
            {
                headerName: "Sum", field: "items", width: 90, suppressSizeToFit: true, cellClass: 'center-cell',
                cellRenderer: function (params) {
                    if (params.value != null) {
                        var res: number = 0;
                        return "<div title='" + res.toString() + " &#8362; + VAT'>" + (Math.round(res * 1.17 * 100) / 100).toString() + " &#8362;</div>";
                    }
                }
            },
            {
                headerName: "Status", field: "status_id", width: 90, suppressSizeToFit: true, cellClass: 'center-cell',
                cellRenderer: function (params) {
                    if (params.value) {
                        return params.context.componentParent.statuses.find(item => item.status_id === params.value).name;
                    }
                    return;
                }
                , cellStyle: function (params) {
                    if (params.value) {
                        let colorX = params.context.componentParent.statuses.find(item => item.status_id === params.value).color;
                        return { backgroundColor: colorX };
                    }
                    return;
                }
            },
            {
                headerName: "Client", field: "client_id", filter: "agTextColumnFilter",
                cellRenderer: function (params) {
                    return params.context.componentParent.clients.find(item => item.client_id === params.value).name;
                }
            },
            {
                headerName: "Items", field: "items", width: 300, suppressSizeToFit: true,
                cellRenderer: function (params) {
                    if (params.value != null) {
                        var res = "<div class='order-items'>";
                        //var row: RowNode = params.node;
                        //row.setRowHeight(21 * params.value.length + 4);
                        return res;
                    }
                    return "-";
                }
            },
            //{ headerName: "Options", cellStyle: 'center-block', width: 230, suppressSizeToFit :true, cellRendererFramework: OrdersListGridComponent }
        ];

        this.getRowHeight = function (params) {
            if (params.data.items.length > 0) {
                return params.data.items.length * 21 + 4;
            } else {
                return 25;
            }
        };
    }

    onGridReady(params) {
        this.gridApi = params.api;
        //params.api.sizeColumnsToFit();
        //this.gridApi.resetRowHeights();
    }

    onSelectionChanged() {
        var selectedRows = this.gridApi.getSelectedRows();
        var selectedRowsString = "";
        this.router.navigate(["/orders/edit", selectedRows[0].order_id]);
    }

    onGridSizeChanged(params) {
        var totalColsWidth = 0;
        const screenWidth = window.innerWidth;
        var columnsToHide = [];

        var allColumns = params.columnApi.getAllColumns();
        if (screenWidth < 800) {
            //this.columnDefs.find(item => item.headerName == "Options").width = 110;
            //params.api.setColumnDefs(this.columnDefs);

            params.columnApi.setColumnWidth(allColumns.find(item => item.colDef.headerName == "Items"), 115);

            columnsToHide.push(allColumns.find(item => item.colDef.field == "confirmation_date"))
            columnsToHide.push(allColumns.find(item => item.colDef.headerName == ""))
            columnsToHide.push(allColumns.find(item => item.colDef.headerName == "Sum"))
            if (screenWidth < 500) {
                columnsToHide.push(allColumns.find(item => item.colDef.headerName == "#"))
            } else {
                params.columnApi.setColumnsVisible([allColumns.find(item => item.colDef.headerName == "#")], true);
            }
            params.columnApi.setColumnsVisible(columnsToHide, false);
        } else {
            params.columnApi.setColumnWidth(allColumns.find(item => item.colDef.headerName == "Items"), 300);
            //this.columnDefs.find(item => item.headerName == "Options").width = 230;
            //params.api.setColumnDefs(this.columnDefs);
        }

        params.api.sizeColumnsToFit();
    }

    open(order) {
        const modalRef = this.modalService.open(OrdersEditComponent);
        modalRef.componentInstance.order = new Order();
        modalRef.componentInstance.order.name = order.name;
        modalRef.componentInstance.order.order_id = order.order_id;

        modalRef.result.then((result) => {
            if (result != null) {
                //order.name = result.name;
            }
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    delete(order: Order) {
        const modalRef = this.modalService.open(ConfirmationDialogComponent);
        modalRef.componentInstance.confirmValue = order.order_id;
        modalRef.componentInstance.title = "Confirm delete"
        modalRef.componentInstance.message = "Are you sure you want to delete '" + order.order_id + "' ?";
        modalRef.result.then((order_id) => {
            if (order_id != null) {
            }
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }

    private getDismissReason(reason: any): string {
        if (reason === ModalDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on a backdrop';
        } else {
            return `with: ${reason}`;
        }
    }

    private loadAllOrders() {
        this.ordersService.getAll().subscribe(
            orders => this.orders = orders,
            err => { },
            () => {
            }
        );
    }

    ngOnInit() {
        this.loadAllOrders();
    }

}
