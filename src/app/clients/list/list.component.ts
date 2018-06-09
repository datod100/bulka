import { Component, OnInit } from '@angular/core';
import { Client } from '../../_models/client';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { environment } from '../../../environments/environment';
import { ClientService, GroupService, AlertService } from '../../_services/index';
import { NgbModal, NgbActiveModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { EditComponent } from '../../clients/edit/edit.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { GridOptions, GridApi } from "ag-grid/main";
import { ListGridComponent } from '../../clients/list-grid/list-grid.component';
import { sprintf } from 'sprintf-js';
import { Group } from '../../_models';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  selectedClient: Client;
  clients: Client[] = [];
  groups: Group[] = [];
  closeResult: string;
  gridOptions: GridOptions;
  columnDefs: any[];
  private gridApi: GridApi;
  tableStyle;
  domLayout;
  context;
  frameworkComponents;
  rowSelection;

  constructor(
    private clientService: ClientService,
    private groupService: GroupService,
    private confirmationService: ConfirmationService,
    private alertService: AlertService,
    private modalService: NgbModal) {
    this.gridOptions = <GridOptions>{};
    this.gridOptions.rowHeight = 34;
    this.gridOptions.domLayout = 'autoHeight'


    this.rowSelection = "multiple";
    this.context = { componentParent: this };
    this.frameworkComponents = {
      squareRenderer: ListGridComponent,
    };

    this.columnDefs = [
      {
        headerName: "&#x2714;", width: 45, cellClass: "cell-center center", editable: false, checkboxSelection: true,
        headerCheckboxSelection: true,
        suppressSorting: true,
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
        headerName: "#", width: 30, suppressSizeToFit: true, cellStyle: 'center-block',suppressMenu: true,suppressSorting: true,
        // it is important to have node.id here, so that when the id changes (which happens
        // when the row is loaded) then the cell is refreshed.
        valueGetter: 'node.id',
        cellRenderer: function (params) {
          if (params.value !== undefined) {
            return (parseInt(params.value) + 1).toString();
          } else {
            return '<img src="../images/loading.gif">'
          }
        }
      },
      { headerName: "פעיל", field: "active", width: 70, cellClass: "center",
        cellRenderer: function (params) {
          if (params.value=="1") {
            return "כן";
          } else {
            return "לא";
          }
        },
        cellStyle: function (params) {
          let style = { backgroundColor: "" };
          if (params.value=="1") {
            style.backgroundColor = "#8fea84";
          } else {
            style.backgroundColor = "#dc8a92";
          }
          return style;
        }
      },
      { headerName: "שם הלקוח", field: "name", width: 220 },
      { headerName: "קבוצה", field: "group.name", width: 78 },
      { headerName: 'מ"ק', field: "group_order", width: 60, cellClass: "center" },
      { headerName: "חפ", field: "hetpei",suppressSorting: true,suppressMenu: true,  width: 100, cellClass: "center" },
      { headerName: "איש קשר", headerClass: "header-cell",suppressSorting: true,suppressMenu: true, field: "contact_person", width: 110 },
      { headerName: "טלפון", headerClass: "header-cell",suppressSorting: true,suppressMenu: true, field: "phone", width: 120, cellClass: "center" },
      { headerName: "איש קשר לתשלום", headerClass: "header-cell",suppressSorting: true,suppressMenu: true, field: "payment_person", width: 120 },
      { headerName: "טלפון לתשלום", headerClass: "header-cell",suppressSorting: true,suppressMenu: true, field: "payment_phone", width: 120, cellClass: "center" },
      { headerName: "כתובת", headerClass: "header-cell",suppressSorting: true,suppressMenu: true, field: "address", width: 260 },
      { headerName: "אפשרויות", headerClass: 'header-cell no-print', cellClass: 'center-block no-print',suppressSorting: true,suppressMenu: true, width: 140, suppressSizeToFit: true, cellRendererFramework: ListGridComponent }
    ];
  }



  onGridSizeChanged(params) {
    const screenWidth = window.innerWidth;

    if (screenWidth < 800) {
      //this.columnDefs.find(item => item.headerName == "Options").width = 110;
      //params.api.setColumnDefs(this.columnDefs);

      params.columnApi.setColumnWidth(params.columnApi.getAllColumns().find(item => item.colDef.headerName == "Options"), 80);
    } else {

      params.columnApi.setColumnWidth(params.columnApi.getAllColumns().find(item => item.colDef.headerName == "Options"), 140);
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
    this.tableStyle = { width: newWidth + 'px', /*height: newHeight + 'px',*/ maxWidth: newWidth + 'px', boxSizing: 'border-box' };

    this.gridApi.doLayout();
  }

  delete(client: Client) {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.confirmValue = client.client_id;
    modalRef.componentInstance.title = "אישור מחיקה"
    modalRef.componentInstance.message = sprintf("אתה בטוח רוצה למחוק לקוח '%s'?", client.name);
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
    Observable.forkJoin(
      this.groupService.getAll(),
      this.clientService.getAll()
    ).subscribe(
      data => {
        this.groups = data[0];
        this.clients = data[1];
        for (let i = 0; i < this.clients.length; i++) {
          this.clients[i].group = this.groups.find(x => x.group_id == this.clients[i].group_id);
        }
      }
    );
  }

  activate(state: boolean) {
    let selectedClients = this.gridApi.getSelectedRows().filter(x=>x.active!=state).map(x=>x.client_id);
   
    if (selectedClients.length==0){
      this.alertService.warning("לא נמצאו שורות לעדכון");
      return;
    }

    if (!state) {
      this.confirmationService.confirm({
        message: 'האם אתה בטוח רוצה להפוך '+selectedClients.length+' לקוחות ללא פעילים?',
        header: 'אישור',
        icon: 'fa fa-question-circle',
        accept: () => {
          this.clientService.updateState(state, selectedClients).subscribe(
            data=>{
              this.alertService.success("פעולה בוצעה");
              this.loadAllClients();
            },
            err=>{
              this.alertService.error("שגיאה");
            }
          );
        }
      });
    }else{
      this.clientService.updateState(state, selectedClients).subscribe(
        data=>{
          this.alertService.success("פעולה בוצעה");
          this.loadAllClients();
        },
        err=>{
          this.alertService.error("שגיאה");
        }
      );
    }


  }

  ngOnInit() {
    this.loadAllClients();
  }

  print() {
    window.print();
  }

}
