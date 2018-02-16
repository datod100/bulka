import { Component, OnInit } from '@angular/core';
import { Client } from '../../_models/client';
import {ICellRendererAngularComp} from "ag-grid-angular";

@Component({
  selector: 'app-orders-list-grid',
  templateUrl: './orders-list-grid.component.html',
  styleUrls: ['./orders-list-grid.component.css']
})
export class OrdersListGridComponent implements ICellRendererAngularComp{

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
