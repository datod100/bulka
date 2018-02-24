import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Status } from '../_models/index';

@Injectable()
export class StatusesService {

  constructor(private http: HttpClient) { }
  getAll() {
    return this.http.get<Status[]>(environment.apiUrl+'/statuses', {})
  }

  getById(id: number) {
      return this.http.get(environment.apiUrl+'/statuses/' + id);
  }

  getCycles() {
    return this.http.get<any[]>(environment.apiUrl+'/cycles', {})
  }

  createCollectionsHistory(history: any) {
    return this.http.post(environment.apiUrl+'/collection_history', history);
  }
}
