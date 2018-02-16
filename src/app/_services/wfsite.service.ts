import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable()
export class WfsiteService {

  constructor(private http: HttpClient) { }
  getCollections() {
    return this.http.get<any[]>(environment.wfApiUrl+'/collections', {})
  }

  getSKUs(category_id) {
    return this.http.get<string[]>(environment.wfApiUrl+'/skus/'+category_id, {})
  }

}
