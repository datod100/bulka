import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Order, OrderItem, OrderSummaryItem } from '../_models/index';

@Injectable()
export class OrdersService {

    constructor(private http: HttpClient) { }
    getServerDate() {
        return this.http.get<any>(environment.apiUrl + '/servertime', {})
    }

    getAll() {
        return this.http.get<Order[]>(environment.apiUrl + '/orders', {})
    }

    getTodayOrderId(){
        return this.http.get<any>(environment.apiUrl + '/orders/today');
    }


    getOrderById(order_id:number){
        return this.http.get<any>(environment.apiUrl + '/orders/id/'+order_id);
    }

    getOrderByDate(date:Date){
        return this.http.get<any>(environment.apiUrl + '/orders/date/'+date.toISOString());
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
