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
import { EditComponent } from './clients/edit/edit.component';
import { RefundComponent } from './refund/refund/refund.component';
import { BalanceReportComponent } from './reports/balance/balance.component';
import { BrowserComponent } from './browser/browser.component';
import { SalesComponent } from './reports/sales/sales.component';

const appRoutes: Routes = [{
        path: 'browser',
        component: BrowserComponent
    },
    {
        path: 'dashboard',
        component: HomeLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                component: HomeComponent
            }
        ]
    },
    {
        path: 'login',
        component: LoginLayoutComponent,
        children: [
            {
                path: '',
                component: LoginComponent
            }
        ]

    },
    {
        path: 'clients',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: ListComponent
            }
        ]
    }
    ,
    {
        path: 'clients/edit/:id',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: EditComponent
            }
        ]
    },
    {
        path: 'clients/edit',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: EditComponent
            }
        ]
    },
    {
        path: 'orders',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: OrdersListComponent
            }
        ]
    },
    {
        path: 'orders/edit/:id',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: OrdersEditComponent
            }
        ]
    },
    {
        path: 'orders/edit/:id/:action',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: OrdersEditComponent
            }
        ]
    },
    {
        path: 'orders/edit',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: OrdersEditComponent
            }
        ]
    },
    {
        path: 'refund',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: RefundComponent
            }
        ]
    },
    {
        path: 'reports/balance',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: BalanceReportComponent
            }
        ]
    },
    {
        path: 'reports/sales',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: SalesComponent
            }
        ]
    },
    {
        path: 'reports/sales/:id',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: SalesComponent
            }
        ]
    },
    {
        path: 'register',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
            {
                path: '',
                component: RegisterComponent
            }
        ]
    },

    // otherwise redirect to home
    { path: '**', redirectTo: 'dashboard' }
];

export const routing = RouterModule.forRoot(appRoutes);