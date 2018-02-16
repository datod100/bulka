import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { RegisterComponent } from './register/index';
import { ListComponent } from './clients/list/index';
import { OrdersListComponent } from './orders/orders-list/index';

import { AuthGuard } from './_guards/index';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { LoginLayoutComponent } from './layouts/login-layout/login-layout.component';
import { OrdersEditComponent } from './orders/orders-edit/orders-edit.component';

const appRoutes: Routes = [
    { 
        path: 'dashboard',
        component: HomeLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path : '',
                component: HomeComponent
            }
        ]
    },
    {
        path: 'login',
        component: LoginLayoutComponent,
        children: [
            {
                path : '',
                component: LoginComponent
            }
        ]

    },
    { 
        path: 'clients',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: ListComponent
            }
        ]
    },
    { 
        path: 'orders',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: OrdersListComponent
            }
        ]
    },
    { 
        path: 'orders/edit/:id',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: OrdersEditComponent
            }
        ]
    },
    { 
        path: 'orders/edit/:id/:action',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: OrdersEditComponent
            }
        ]
    },
    { 
        path: 'orders/edit',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: OrdersEditComponent
            }
        ]
    },
    { 
        path: 'register',
        component: HomeLayoutComponent,
        children: [
            {
                path : '',
                component: RegisterComponent
            }
        ]
    },

    // otherwise redirect to home
    { path: '**', redirectTo: 'dashboard' }
];

export const routing = RouterModule.forRoot(appRoutes);