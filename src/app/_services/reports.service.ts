import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class ReportsService {
  constructor(private http: HttpClient) { }

  getRefundReport(start_date, end_date) {
      return this.http.get<any[]>(environment.apiUrl + '/reports/refunds/'+start_date+'/'+end_date);
  }

}
