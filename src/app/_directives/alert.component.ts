﻿import { Component, OnInit } from '@angular/core';
import { AlertService } from '../_services/index';
import { Message } from 'primeng/components/common/api';
import { MessageService } from 'primeng/components/common/messageservice';

@Component({
    moduleId: module.id.toString(),
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent {
    msgs: Message[] = [];

    constructor(private alertService: AlertService,
        private messageService: MessageService) { }

    ngOnInit() {
        this.alertService.getMessage().subscribe(message => {
            if (message) {
                //this.msgs =[];
                //this.msgs.push({ severity: message.type,  detail: message.text });
                if (message.text.text) message.text = message.text.text;
                this.messageService.add({ severity: message.type, detail: message.text });
            }
        });
    }
}