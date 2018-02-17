import { Component, OnInit, OnDestroy } from '@angular/core';
import { Client } from '../../_models/client';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, AlertService, GroupService, ProductService } from '../../_services/index';
import { Observable } from 'rxjs/Observable';
import { Group, Product, Price } from '../../_models';
import {NgbTimepickerConfig} from '@ng-bootstrap/ng-bootstrap';
import {NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';

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
  selectedGroup:Group;
  prices: Price[] = [];

  constructor(
    private route: ActivatedRoute,
    private alertService: AlertService,
    private groupService: GroupService,
    private productService: ProductService,
    config: NgbTimepickerConfig,
    private clientService: ClientService) {

    this.client = new Client();
    this.selectedGroup = new Group(1,"","");
    
    config.spinners = false;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  setDuration(x){
    
  }

  selectGroup(group:Group){
    this.selectedGroup = group;
  }

  timeToNgbTimeStruct(time){
    let tTime = new Date("1968-11-16T"+time);
    return {hour: tTime.getHours(), minute: tTime.getMinutes(), second:0};
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.client_id = +params['id'];
      var action = params['action'];

      if (this.client_id) {
        this.title = "עריכת";

        Observable.forkJoin(
          this.clientService.getById(this.client_id),
          this.groupService.getAll(),
          this.productService.getAll()
        ).subscribe(
          data => {
            this.client = data[0][0];
            this.groups = data[1];
            this.products = data[2];

            this.products.forEach(product => this.prices.push(new Price(product)));

            this.selectedGroup = this.groups.find(group=> group.group_id == this.client.group_id);
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
