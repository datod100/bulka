import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../_services/index';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private router: Router, private authenticationService:AuthenticationService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.authenticationService.isLogedIn().map(
            e => {
                if (e){
                    return true;
                }else{
                    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
                    return false;
                }
            },
            err=>{
                this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
                return Observable.of(false);
            }
        );
    }
}