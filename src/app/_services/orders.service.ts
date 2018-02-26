import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Order, OrderItem, OrderSummaryItem } from '../_models/index';

@Injectable()
export class OrdersService {

    constructor(private http: HttpClient) { }
    getAll() {
        return this.http.get<Order[]>(environment.apiUrl + '/orders', {})
    }

    getTodayOrderId(){
        return this.http.get<number>(environment.apiUrl + '/orders/today');
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
}
