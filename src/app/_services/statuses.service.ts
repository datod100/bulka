import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class StatusesService {

  constructor(private http: HttpClient) { }
  getStatuses() {
    return Observable.of<string[]>(['חדש', 'מוכן', 'נשלח']);
  }

  getCycles() {
    return this.http.get<any[]>(environment.apiUrl+'/cycles', {})
  }

  createCollectionsHistory(history: any) {
    return this.http.post(environment.apiUrl+'/collection_history', history);
  }
}
