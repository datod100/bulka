import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { Order, Client, Status, OrderItem } from '../../_models/index';
import { StatusesService, ClientService, OrdersService, AlertService } from '../../_services/index';
import { ActivatedRoute, Router } from '@angular/router';
import { error } from 'selenium-webdriver';
import { Observable } from 'rxjs/Observable';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ScrollToService } from 'ng2-scroll-to-el';

@Component({
  selector: 'app-orders-edit',
  templateUrl: './orders-edit.component.html',
  styleUrls: ['./orders-edit.component.css']
})

export class OrdersEditComponent implements OnInit, OnDestroy {
  title;
  order: Order;
  statuses: Status[] = [];
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
    private alertService: AlertService,
    private scrollService: ScrollToService,
    private clientService: ClientService) {

    this.order = new Order();
    this.order.client = new Client();
    this.order.status = new Status();
    this.order.status_id = 2;
    var dt = new Date();
    dt.setUTCFullYear(dt.getFullYear(), dt.getMonth()+1, dt.getDate());
    
    this.order.confirmation_date = dt;
    this.order.supply_date=null;
    this.selectedCollection.name = "Ami";

  }

  search(event) {
    this.filteredClients = this.clients.filter(v => v.name.toLowerCase().indexOf(event.query.toLowerCase()) > -1);
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.order_id = +params['id'];
      var action = params['action'];

      Observable.forkJoin(
        this.clientService.getAll(),
        this.statusesService.getAll()
      ).subscribe(
        data => {
          this.clients = data[0];
          this.statuses = data[1];
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
                this.order.status = this.statuses.find(item => item.status_id === this.order.status_id);
                if (this.order.confirmation_date) this.order.confirmation_date = new Date(this.order.confirmation_date);
                if (this.order.supply_date) this.order.supply_date = new Date(this.order.supply_date);

                if (action=="AddItem"){
                  this.addItem();
                }
              },
              err => console.error(err)
              );

          } else {
            this.title = "Create";
            this.order.status = this.statuses.find(item => item.status_id === this.order.status_id);
          }

        }
        );
    });
  }

  selectItem(item: OrderItem) {
    if (item) {
      this.selectedItem = JSON.parse(JSON.stringify(item));
      this.scrollService.scrollTo("#itemForm",700);
      return this.selectedItem;
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  changeStatus(status_id) {
    this.order.status_id = status_id;
    this.order.status = this.statuses.find(item => item.status_id === status_id);
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
          if (navigateOff){
            this.router.navigate(["/orders"]);
          }else{
            this.router.navigate(["/orders/edit/"+data+"/AddItem"]);
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

  addItem() {
    if (!this.order.order_id) {
      this.save(false);
    }

    this.selectedItem = new OrderItem();
    this.selectedItem.product_type = "Rolls";
    this.selectedItem.price = 0;
    this.selectedItem.order_id = this.order.order_id;
    this.selectedItem.quantity = 1;
    this.scrollService.scrollTo("#itemForm",700);
  }

  delete(content) {
    this.modalService.open(content).result.then((result) => {
      if (result == "delete") {
        this.ordersService.delete(this.order_id).toPromise();
        this.router.navigate(["/orders"]);
      }
    }, (reason) => {
      //this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  OnItemSave(event) {
    this.selectedItem = null;
    this.ordersService.getItemsById(this.order_id).subscribe(data => this.order.items = data);
    switch(event){
     case "add" : this.alertService.success("Item added"); break;
     case "update" : this.alertService.success("Item updated"); break;
    }
  }

  OnItemDelete()
  {
    this.selectedItem = null;
    this.ordersService.getItemsById(this.order_id).subscribe(data => this.order.items = data);
    this.alertService.success("Item deleted");
  }
}
