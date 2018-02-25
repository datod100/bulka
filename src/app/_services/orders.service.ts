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

    getById(id: number) {
        return this.http.get<Order>(environment.apiUrl + '/orders/' + id);
    }

    getSummaryItemsById(order_id: number) {
        return this.http.get<OrderSummaryItem[]>(environment.apiUrl + '/order/summary/' + order_id);
    }

    updateItem(order_item: OrderItem) {
        return this.http.put(environment.apiUrl + '/order_items', order_item);
    }

    deleteItem(order_item_id: number) {
        return this.http.delete(environment.apiUrl + '/order_items/' + order_item_id);
    }
    createItem(order_item: OrderItem) {
        return this.http.post(environment.apiUrl + '/order_items', order_item);
    }

    create(order: Order) {
        return this.http.post(environment.apiUrl + '/orders', order);
    }

    update(order: Order) {
        return this.http.put(environment.apiUrl + '/orders', order);
    }

    delete(id: number) {
        return this.http.delete(environment.apiUrl + '/orders/' + id);
    }
}
