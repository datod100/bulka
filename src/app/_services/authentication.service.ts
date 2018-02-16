import { Injectable } from '@angular/core';

import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class AuthenticationService {
    private loggedIn = new BehaviorSubject<boolean>(false);

    constructor(private http: HttpClient, private router: Router) { }

    login(username: string, password: string) {
        return this.http.post<any>(environment.apiUrl + '/login', { email: username, password: password })
            .map(user => {
                // login successful if there's a jwt token in the response
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.loggedIn.next(true);
                    this.router.navigate(['/']);
                }
                return user;
            });
    }

    isLogedIn(){
        let user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.token) {
            return this.http.post<any>(environment.apiUrl + '/session', { token: user.token }).map(
                session => {
                    //this.loggedIn.next(true);
                    //this.router.navigate(['/']);
                    return true;
                },
                err=>{
                    return Observable.of(false);
                }
            ).catch(() => {
                return Observable.of(false);
            });
        }
        return Observable.of(false);
    }

    logout() {
        // remove user from local storage to log user out
        this.http.get(environment.apiUrl + '/logout').toPromise();
        this.loggedIn.next(false);
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
    }
}