import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as moment from 'moment';

import { Order, OrderItem, OrderSummaryItem, RefundItem } from '../_models/index';

@Injectable()
export class RefundsService {

    constructor(private http: HttpClient) {
        moment.locale('en-il');
    }

    getRefundProducts(refund_id: number) {
        return this.http.get<RefundItem[]>(environment.apiUrl + '/refunds/products/' + refund_id);
    }

    getTodayRefundId(){
        return this.getRefundIdByDate(new Date());
    }

    getRefundIdByDate(date:Date){
        return this.http.get<any>(environment.apiUrl + '/refunds/create_date/'+moment(date).format('YYYY-MM-DD'));
    }

    getRefundById(refund_id:number){
        return this.http.get<any>(environment.apiUrl + '/refunds/'+refund_id);
    }

    getRefundByDate(date:Date){
        return this.http.get<any>(environment.apiUrl + '/refunds/date/'+moment(date).format('YYYY-MM-DD'));
    }

    getByCriteria(criteria) {
        return this.http.get<Order[]>(environment.apiUrl + '/refunds/' + criteria);
    }

    saveRefund(refundItems: RefundItem[], refund_id) {
        return this.http.put<number[]>(environment.apiUrl + '/refunds/save/'+refund_id, refundItems);
    }

}
