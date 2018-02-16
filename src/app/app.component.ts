import { Component, Output } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';

import '../assets/app.css';


@Component({
    moduleId: module.id.toString(),
    selector: 'app',
    templateUrl: 'app.component.html'
})

export class AppComponent {
    @Output() path: string;

    constructor(private router: Router, private activatedRoute: ActivatedRoute) {
        this.router.events.subscribe(event => {
            if(event instanceof NavigationStart) {
                this.path = event.url;
            }
        });
    }

}