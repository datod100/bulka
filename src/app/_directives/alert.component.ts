import { Component, OnInit } from '@angular/core';
import { AlertService } from '../_services/index';
import { Message } from 'primeng/components/common/api';

@Component({
    moduleId: module.id.toString(),
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent {
    msgs: Message[] = [];

    constructor(private alertService: AlertService) { }

    ngOnInit() {
        this.alertService.getMessage().subscribe(message => {
            if (message) {
                this.msgs =[];
                this.msgs.push({ severity: message.type,  detail: message.text });
            }
        });
    }
}