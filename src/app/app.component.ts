import { Component, Output } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';

import '../assets/app.css';


@Component({
    moduleId: module.id.toString(),
    selector: 'app',
    templateUrl: 'app.component.html'
})

export class AppComponent {
    @Output() path: string;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private deviceService: DeviceDetectorService) {

        if (this.deviceService.browser!='chrome'){
            this.router.navigate(['browser']);
        }

        this.router.events.subscribe(event => {
            if(event instanceof NavigationStart) {
                this.path = event.url;
            }
        });
    }

}