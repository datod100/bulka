import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { OrderItem } from '../../_models';
import { TitleCasePipe } from '@angular/common';
import { Observable } from 'rxjs/Observable';
import { WfsiteService, StatusesService, OrdersService } from '../../_services';
import { SpinnerModule } from 'primeng/spinner';
import { isArray, isString, isObject } from 'util';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-orders-edit-item',
  templateUrl: './orders-edit-item.component.html',
  styleUrls: ['./orders-edit-item.component.css']
})

export class OrdersEditItemComponent implements OnInit {

  private _item: OrderItem;
  @Output() OnSave = new EventEmitter<string>();
  @Output() OnDelete = new EventEmitter();
  @Input()
  set item(selectedItem: OrderItem) {
    if (selectedItem != null) {
    }
    this._item = selectedItem;
  }
  get item(): OrderItem { return this._item; }

  public product_types: string[] = ['Rolls', 'Fabrics', 'Mural', 'Meter'];
  selectedCollection: { name: string; id: number } = { name: null, id: -1 };
  public collections = [];
  public filteredCollections = [];
  public articles = [];
  public filteredArticles = [];

  constructor(
    private wfsiteService: WfsiteService,
    private utilsService: StatusesService,
    private modalService: NgbModal,
    private ordersService: OrdersService
  ) { }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    Observable.forkJoin(
      this.wfsiteService.getCollections()
    ).subscribe(
      data => {
        this.collections = data[0].concat(data[1]);
      },
      err => console.error(err),
      () => { }
    );
  }

  collectionSelected(event) {
    this.wfsiteService.getSKUs(event.id).subscribe(
      data => this.articles = data
    );
  }

  searchCollection(event) {
    this.filteredCollections = this.collections.filter(v => v.name.toLowerCase().indexOf(event.query.toLowerCase()) > -1);
  }


  searchArticle(event) {
    this.filteredArticles = this.articles.filter(v => v.toLowerCase().indexOf(event.query.toLowerCase()) > -1);
  }

  close(){
    this.OnSave.emit("close");
  }

}
