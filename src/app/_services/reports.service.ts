import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DatePipe } from '@angular/common';

@Injectable()
export class ReportsService {
  constructor(private http: HttpClient) { }

  getBalanceReport(start_date, end_date) {
    let start = new DatePipe('en-US').transform(start_date, 'yyyy-MM-dd');
    let end = new DatePipe('en-US').transform(end_date, 'yyyy-MM-dd');
      return this.http.get<any[]>(environment.apiUrl + '/reports/refunds/'+start+'/'+end);
  }

}
