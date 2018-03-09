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
        return this.http.get<any>(environment.apiUrl + '/refunds/today');
    }

    getRefundById(refund_id:number){
        return this.http.get<any>(environment.apiUrl + '/refunds/'+refund_id);
    }

    getRefundByDate(date:Date){
        return this.http.get<any>(environment.apiUrl + '/refunds/date/'+date.toISOString());
    }

    getByCriteria(criteria) {
        return this.http.get<Order[]>(environment.apiUrl + '/refunds/' + criteria);
    }

    saveRefund(refundItems: RefundItem[], refund_id) {
        return this.http.put<number[]>(environment.apiUrl + '/refunds/save/'+refund_id, refundItems);
    }

}
