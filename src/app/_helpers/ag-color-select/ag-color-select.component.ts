import {AfterViewInit, Component, ViewChild, ViewContainerRef, Input} from "@angular/core";

import {ICellEditorAngularComp} from "ag-grid-angular";
import { ICellEditorParams, IAfterGuiAttachedParams } from "ag-grid";
import { Group } from "../../_models";
import { NgbDropdown } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-ag-color-select',
  templateUrl: './ag-color-select.component.html',
  styleUrls: ['./ag-color-select.component.css']
})

export class AgColorSelectComponent implements ICellEditorAngularComp, AfterViewInit {
  private params: any;
  groups:Group[] = [];
  selectedGroup: Group;
  cellHeight;
  cellWidth;
  @ViewChild(NgbDropdown)
  private menu: NgbDropdown;

  @ViewChild('container', {read: ViewContainerRef}) public container;

  constructor() {
    this.selectedGroup = new Group(1, "", "");
  }

  // dont use afterGuiAttached for post gui events - hook into ngAfterViewInit instead for this
  ngAfterViewInit() {
      setTimeout(() => {
          this.container.element.nativeElement.focus();
      })
  }

  agInit(params: any): void {
      this.cellHeight = (+params.node.rowHeight-2)+"px";
      this.cellWidth = (+params.column.actualWidth-2)+"px";
      this.groups = params.context.componentParent.groups;
      if (params.value){
        this.selectedGroup = params.value;
      }else{
        this.selectedGroup = this.groups[0];
      }
      this.params = params;
      this.menu.open();
  }

  selectGroup(group){
    this.selectedGroup = group;
  }

  getValue(): any {
      return this.selectedGroup;
  }

  isPopup(): boolean {
      return true;
  }


  toggleMood(): void {
  }

  onClick(happy: boolean) {
      this.params.api.stopEditing();
  }

  onKeyDown(event): void {
      let key = event.which || event.keyCode;
      if (key == 37 ||  // left
          key == 39) {  // right
          this.toggleMood();
          event.stopPropagation();
      }
  }
}
