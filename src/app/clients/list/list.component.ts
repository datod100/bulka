import { Component, OnInit } from '@angular/core';
import { Client } from '../../_models/client';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { environment } from '../../../environments/environment';
import { ClientService } from '../../_services/index';
import { NgbModal, NgbActiveModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { EditComponent } from '../../clients/edit/edit.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import {GridOptions, GridApi} from "ag-grid/main";
import { ListGridComponent } from '../../clients/list-grid/list-grid.component';
import { sprintf } from 'sprintf-js';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  selectedClient: Client;
  clients: Client[] = [];
  closeResult: string;
  gridOptions: GridOptions;
  columnDefs: any[];
  private gridApi: GridApi;
  tableStyle;
  domLayout;
  private context;
  private frameworkComponents;

  constructor(private clientService: ClientService, private modalService: NgbModal) {    
    this.gridOptions = <GridOptions>{};
    this.gridOptions.rowHeight = 40;
    this.gridOptions.domLayout = 'autoHeight'
    

    this.context = { componentParent: this };
    this.frameworkComponents = {
      squareRenderer: ListGridComponent,
    };

    this.columnDefs = [
        {headerName: "#", width: 30, suppressSizeToFit: true, cellStyle:'center-block',
        // it is important to have node.id here, so that when the id changes (which happens
        // when the row is loaded) then the cell is refreshed.
        valueGetter: 'node.id',
        cellRenderer: function(params) {
            if (params.value !== undefined) {
                return (parseInt(params.value)+1).toString();
            } else {
                return '<img src="../images/loading.gif">'
            }
        }},
        {headerName: "שם הלקוח", field: "name", width:250},
        {headerName: "איש קשר לתשלום", field: "payment_person", width:120},
        {headerName: "טלפון לתשלום", field: "payment_phone", width:120},
        {headerName: "אפשרויות", headerClass:'no-print', cellClass:'center-block no-print', width:160, suppressSizeToFit: true, cellRendererFramework: ListGridComponent}
    ];
  }



  onGridSizeChanged(params) {
    const screenWidth = window.innerWidth;

    if (screenWidth < 800) {
        //this.columnDefs.find(item => item.headerName == "Options").width = 110;
        //params.api.setColumnDefs(this.columnDefs);

        params.columnApi.setColumnWidth(params.columnApi.getAllColumns().find(item => item.colDef.headerName == "Options"), 80);
    } else {
        
       params.columnApi.setColumnWidth(params.columnApi.getAllColumns().find(item => item.colDef.headerName == "Options"), 160);
    }

    this.gridApi.sizeColumnsToFit();
    this.calcGrid();
}

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.calcGrid();
  }

  calcGrid() {
    let screenWidth = document.documentElement.clientWidth;
    let screenHeight = document.documentElement.clientHeight;

    let newWidth = 0;
    for (let i = 0; i < this.columnDefs.length; i++) {
      newWidth += this.columnDefs[i].width;
    }
    newWidth += 20;
    let newHeight = screenHeight - 175;
    this.tableStyle = { width:newWidth+'px', height: newHeight + 'px', maxWidth:  newWidth + 'px', boxSizing: 'border-box' };
    
    this.gridApi.doLayout();
  }

  delete(client:Client) {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.confirmValue = client.client_id;
    modalRef.componentInstance.title = "אישור מחיקה"
    modalRef.componentInstance.message = sprintf("אתה בטוח רוצה למחוק לקוח '%s'?",client.name);
    modalRef.result.then((client_id) => {
      if (client_id != null) {
        this.clientService.delete(client_id).subscribe((res: any) => {
          this.loadAllClients();
        }, error => console.log(error));
      }
    });
  }

  close(message: string) {
    this.selectedClient.name = message;
  }

  private loadAllClients() {
    this.clientService.getAll().subscribe(clients => { this.clients = clients; });
  }

  ngOnInit() {
    this.loadAllClients();
  }

  print(){
    window.print();
  }

}
