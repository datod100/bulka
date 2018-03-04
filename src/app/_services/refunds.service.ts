import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Order, OrderItem, OrderSummaryItem, RefundItem } from '../_models/index';

@Injectable()
export class RefundsService {

    constructor(private http: HttpClient) { }
    getRefundProducts(refund_id: number) {
        return this.http.get<RefundItem[]>(environment.apiUrl + '/refunds/products/' + refund_id);
    }

    getTodayRefundId(){
        return this.http.get<number>(environment.apiUrl + '/refunds/today');
    }

    getByCriteria(criteria) {
        return this.http.get<Order[]>(environment.apiUrl + '/refunds/' + criteria);
    }

    saveRefund(orderlines: Order[]) {
        return this.http.put(environment.apiUrl + '/orders/save', orderlines);
    }

}
