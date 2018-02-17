import { Component, OnInit, OnDestroy } from '@angular/core';
import { Client } from '../../_models/client';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, AlertService } from '../../_services/index';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnDestroy {
  client: Client;
  client_id: number;
  private sub: any;
  title: String;

  constructor(
    private route: ActivatedRoute,
    private alertService: AlertService,
    private clientService: ClientService) {

    this.client = new Client();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.client_id = +params['id'];
      var action = params['action'];

      if (this.client_id) {
        this.title = "עריכת";

        Observable.forkJoin(
          this.clientService.getById(this.client_id)
        ).subscribe(
          data => {
            this.client = data[0][0];
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
