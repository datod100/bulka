import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// used to create fake backend
//import { fakeBackendProvider } from './_helpers/index';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { JwtInterceptor } from './_helpers/index';
import { AlertService, AuthenticationService, UserService, ClientService, OrdersService, StatusesService, GroupService, ProductService, RefundsService, ReportsService, DocsService } from './_services/index';
import { HomeComponent } from './home/index';
import { LoginComponent } from './login/index';
import { RegisterComponent } from './register/index';
import { HeaderComponent } from './header/header.component';
import { HomeLayoutComponent } from './layouts/home-layout/home-layout.component';
import { LoginLayoutComponent } from './layouts/login-layout/login-layout.component';
import { ListComponent } from './clients/list/list.component';
import { EditComponent } from './clients/edit/edit.component';
import { NgbModule, NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { FloatingActionMenuModule } from 'ng2-floating-action-menu';
import { ActionMenuComponent } from './action-menu/action-menu.component';
import { AutofocusDirective } from './_directives/autofocus.directive';
import { AgGridModule } from 'ag-grid-angular';
import { OrdersListComponent } from './orders/orders-list/orders-list.component';
import { OrdersEditComponent } from './orders/orders-edit/orders-edit.component';
import { ListGridComponent } from './clients/list-grid/list-grid.component';
import { OrdersListGridComponent } from './orders/orders-list-grid/orders-list-grid.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SpinnerModule } from 'primeng/spinner';
import { GrowlModule } from 'primeng/growl';
import { NgbDateNativeAdapter, NgbDateCustomParserFormatter } from './_providers/date-providers';
import { OrdersEditItemComponent } from './orders/orders-edit-item/orders-edit-item.component';
import { ScrollToModule } from 'ng2-scroll-to-el';
import { OnlyNumber } from './_directives/only-number.directive';
import { AgColorSelectComponent } from './_helpers/ag-color-select/ag-color-select.component';
import { RefundComponent } from './refund/refund/refund.component';
import { CalendarModule } from 'primeng/calendar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BalanceReportComponent } from './reports/balance/balance.component';
import { MomentModule } from 'angular2-moment';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MessageService } from 'primeng/components/common/messageservice';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { BrowserComponent } from './browser/browser.component';

@NgModule({
    imports: [
        NgbModule.forRoot(),
        ScrollToModule.forRoot(),
        BrowserModule,
        FormsModule,
        HttpClientModule,
        routing,
        FloatingActionMenuModule,
        AutoCompleteModule,
        SpinnerModule,
        CalendarModule,
        GrowlModule,
        CalendarModule,
        BrowserAnimationsModule,
        MomentModule,
        ConfirmDialogModule,
        NgxSpinnerModule,
        DialogModule,
        DeviceDetectorModule.forRoot(),
        AgGridModule.withComponents([ListGridComponent, OrdersListGridComponent, AgColorSelectComponent]),
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        HeaderComponent,
        HomeLayoutComponent,
        LoginLayoutComponent,
        ListComponent,
        EditComponent,
        ConfirmationDialogComponent,
        ActionMenuComponent,
        AutofocusDirective,
        OrdersListComponent,
        OrdersEditComponent,
        ListGridComponent,
        OrdersListGridComponent,
        OrdersEditItemComponent,
        OnlyNumber,
        AgColorSelectComponent,
        RefundComponent,
        BalanceReportComponent,
        BrowserComponent
    ],
    providers: [
        AuthGuard,
        AlertService,
        AuthenticationService,
        ClientService,
        OrdersService,
        StatusesService,
        RefundsService,
        ProductService,
        ReportsService,
        GroupService,
        UserService,
        ConfirmationService,
        DocsService,
        MessageService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        },
        { provide: NgbDateAdapter, useClass: NgbDateNativeAdapter },
        { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }
        // provider used to create fake backend
        //fakeBackendProvider
    ],
    entryComponents: [
        EditComponent,
        ConfirmationDialogComponent
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }