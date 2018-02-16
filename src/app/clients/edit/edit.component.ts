import { Component, Input } from '@angular/core';
import { Client } from '../../_models/client';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent{
  @Input() client: Client;

  constructor(public activeModal: NgbActiveModal) { }
  
}
