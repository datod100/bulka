import { Component, OnInit } from '@angular/core';
import { Client } from '../../_models/client';
import {ICellRendererAngularComp} from "ag-grid-angular";

@Component({
  selector: 'app-list-grid',
  templateUrl: './list-grid.component.html',
  styleUrls: ['./list-grid.component.css']
})
export class ListGridComponent implements ICellRendererAngularComp{

  private params: any;

  agInit(params: any): void {
      this.params = params;
  }

  open() {
    this.params.context.componentParent.open(this.params.data);
  }

  delete(){
    this.params.context.componentParent.delete(this.params.data);
  }

  refresh(): boolean {
    return false;
  }
  constructor() { }
}
