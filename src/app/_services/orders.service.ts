import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

import { Order, OrderItem, OrderSummaryItem } from '../_models/index';

@Injectable()
export class OrdersService {

    constructor(private http: HttpClient) {
        moment.locale('en-il');
    }
    getServerDate() {
        return this.http.get<any>(environment.apiUrl + '/servertime', {})
    }

    getActiveDates(month, year) {
        return this.http.get<any[]>(environment.apiUrl + '/orders/active_dates/' + month + '/' + year);
    }

    getAll() {
        return this.http.get<Order[]>(environment.apiUrl + '/orders', {})
    }

    createOrderId(date: Date) {
        return this.http.get<any>(environment.apiUrl + '/orders/create/' + moment(date).format('YYYY-MM-DD'));
    }

    getOrderById(order_id: number) {
        return this.http.get<any>(environment.apiUrl + '/orders/id/' + order_id);
    }

    getOrderByDate(date: Date) {
        return this.http.get<any>(environment.apiUrl + '/orders/date/' + moment(date).format('YYYY-MM-DD'));
    }

    getByCriteria(criteria) {
        return this.http.get<Order[]>(environment.apiUrl + '/orders/' + criteria);
    }

    getOrderProducts(order_id: number) {
        return this.http.get<OrderItem[]>(environment.apiUrl + '/order/products/' + order_id);
    }

    getSummaryItemsById(order_id: number) {
        return this.http.get<OrderSummaryItem[]>(environment.apiUrl + '/order/summary/' + order_id);
    }

    saveSummaryItems(items: OrderSummaryItem[]) {
        return this.http.put(environment.apiUrl + '/order/summary/save', items);
    }

    saveOrderLines(orderlines: Order[]) {
        return this.http.put(environment.apiUrl + '/orders/save', orderlines);
    }

    saveOrderProducts(orderProducts: OrderItem[]) {
        return this.http.put(environment.apiUrl + '/order/products/save', orderProducts);
    }

    updateInvoice(index_id: number) {
        return this.http.get<any>(environment.apiUrl + '/orders/update_invoice_number/' + index_id);
    }
}
