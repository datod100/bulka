
import { Observable } from 'rxjs/Observable';
import { AlertService, AuthenticationService } from '../_services/index';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styles: ['header.component.css']
})
export class HeaderComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;

  constructor(private authService: AuthenticationService) { }

  ngOnInit() {
  }

  onLogout(){
    this.authService.logout();
  }

}
