import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DatePipe } from '@angular/common';

@Injectable()
export class DocsService {
  constructor(private http: HttpClient) { }

  getPackingLists(order_id:number, indecies:number[]) {
      window.location.href = environment.apiUrl + '/docs/packinglist/'+order_id+"/"+indecies.join(',');
      //return this.http.get<any[]>(environment.apiUrl + '/docs/packinglist/'+order_id+"/"+indecies.join(','));
  }

}
