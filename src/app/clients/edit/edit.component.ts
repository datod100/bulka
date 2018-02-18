import { Component, OnInit, OnDestroy } from '@angular/core';
import { Client } from '../../_models/client';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, AlertService, GroupService, ProductService } from '../../_services/index';
import { Observable } from 'rxjs/Observable';
import { Group, Product, Price } from '../../_models';
import { NgbTimepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { sprintf } from 'sprintf-js';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  providers: [NgbTimepickerConfig] // add NgbTimepickerConfig to the component providers
})
export class EditComponent implements OnInit, OnDestroy {
  client: Client;
  groups: Group[] = [];
  products: Product[] = [];
  client_id: number;
  travel_duration: NgbTimeStruct;
  default_time1: NgbTimeStruct;
  default_time2: NgbTimeStruct;
  default_time3: NgbTimeStruct;
  private sub: any;
  title: String;
  selectedGroup: Group;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private groupService: GroupService,
    private productService: ProductService,
    config: NgbTimepickerConfig,
    private clientService: ClientService) {

    this.client = new Client();
    this.client.prices = [];
    this.selectedGroup = new Group(1, "", "");

    config.spinners = false;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  selectGroup(group: Group) {
    this.selectedGroup = group;
  }

  timeToNgbTimeStruct(time) {
    let tTime = new Date("1968-11-16T" + time);
    return { hour: tTime.getHours(), minute: tTime.getMinutes(), second: 0 };
  }

  NgbTimeStructToTime(time: NgbTimeStruct) {
    if (time != null) return sprintf("0000-00-00 %d:%d:0", time.hour, time.minute);
    return null;
  }

  save() {
    this.client.group_id = this.selectedGroup.group_id;
    this.client.default_time1 = this.NgbTimeStructToTime(this.default_time1);
    this.client.default_time2 = this.NgbTimeStructToTime(this.default_time2);
    this.client.default_time3 = this.NgbTimeStructToTime(this.default_time3);
    this.client.travel_duration = this.NgbTimeStructToTime(this.travel_duration);

    this.client.prices.forEach(p=>p.price = +p.price);

    if (this.client_id) {
      this.clientService.update(this.client).subscribe(data => { });
    }

    if (this.client_id) {
      this.clientService.update(this.client).subscribe(
        data => {
          this.clientService.savePrices(this.client_id, this.client.prices).subscribe(
            x => { },
            err => {
              this.alertService.error(err.message);
            }
          );
          this.router.navigate(["/clients"]);
          this.alertService.success("פרטי לקוח עודכנו בהצלחה");
        },
        err => {
          this.alertService.error(err.message);
        }
      );
    } else {
      this.clientService.create(this.client).subscribe(
        data => {
          this.client_id = +data;

          this.clientService.savePrices(this.client_id, this.client.prices).subscribe();
          this.router.navigate(["/clients"]);
          this.alertService.success("רשומה התווספה בהצלחה");
        },
        err => {
          this.alertService.error(err.message);
        }
      );
    }

  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.client_id = +params['id'];
      var action = params['action'];

      this.productService.getAll().subscribe(
        products => {
          this.products = products;
          this.products.forEach(product => this.client.prices.push(new Price(product)));
        }
      );

      this.groupService.getAll().subscribe(
        groups => {
          this.groups = groups;
          this.selectedGroup = this.groups[0];
        }
      );

      if (this.client_id) {
        this.title = "עריכת";

        Observable.forkJoin(
          this.clientService.getById(this.client_id),
          this.clientService.getPricesByClientId(this.client_id)
        ).subscribe(
          data => {
            this.client = data[0][0];
            let prices: Price[] = data[1];
            this.client.prices = [];
            this.products.forEach(product => {
              let price = prices.find(p => p.product_id == product.product_id);

              this.client.prices.push(new Price(product, (price) ? price.price : null));
            });

            this.selectedGroup = this.groups.find(group => group.group_id == this.client.group_id);
            this.travel_duration = this.timeToNgbTimeStruct(this.client.travel_duration);
            this.default_time1 = this.timeToNgbTimeStruct(this.client.default_time1);
            this.default_time2 = this.timeToNgbTimeStruct(this.client.default_time2);
            this.default_time3 = this.timeToNgbTimeStruct(this.client.default_time3);
          },
          err => console.error(err)
        );

      } else {
        this.title = "הוספת";
      }
    }
    );
  }


}
