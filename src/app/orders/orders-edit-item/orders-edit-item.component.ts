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
      this.selectedCollection = this.collections.find(item => item.name == selectedItem.collection_name);
      if (this.selectedCollection) {
        this.wfsiteService.getSKUs(this.selectedCollection.id).subscribe(
          data => this.articles = data
        );
      }
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
      this.wfsiteService.getCollections(),
      this.utilsService.getCollectionsHistory()
    ).subscribe(
      data => {
        this.collections = data[0].concat(data[1]);
        this.collections.sort((a: any, b: any) => {
          var nameA = a.name.toUpperCase();
          var nameB = b.name.toUpperCase();
          if (nameA < nameB) {
            return -1;
          } else if (nameA > nameB) {
            return 1;
          } else {
            return 0;
          }
        });
      },
      err => console.error(err),
      () => { }
    );
  }

  collectionSelected(event) {
    this.item.collection_name = event.name;
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

  delete(content) {
    this.modalService.open(content).result.then((result) => {
      if (result == "delete") {
        this.ordersService.deleteItem(this.item.order_item_id).subscribe(
          data => {
            this.OnDelete.emit();
          }
        );
      }
    }, (reason) => {
      //this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  close(){
    this.OnSave.emit("close");
  }

  save(collection) {
    if (!isObject(collection)) {
      this.item.collection_name = collection;
      this.utilsService.createCollectionsHistory({ 'collection': collection, 'article': this.item.article }).subscribe(
        data => { },
        err => { },
        () => {
          this.refreshData();
        }
      );
    }

    if (this.item.order_item_id) { //update
      this.ordersService.updateItem(this.item).subscribe(
        data => { },
        err => { },
        () => {
          this.OnSave.emit("update");
        }
      );
    } else {
      this.ordersService.createItem(this.item).subscribe(
        data => { },
        err => {

        },
        () => {
          this.OnSave.emit("add");
        }
      );
    }
  }
}
