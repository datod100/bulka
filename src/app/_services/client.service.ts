import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Client } from '../_models/index';

@Injectable()
export class ClientService {

  constructor(private http: HttpClient) { }
  getAll() {
    return this.http.get<Client[]>(environment.apiUrl+'/clients', {})
  }

  getById(client_id: number) {
      return this.http.get(environment.apiUrl+'/clients/' + client_id);
  }

  create(client: Client) {
      return this.http.post(environment.apiUrl+'/clients', client);
  }

  update(client: Client) {
      return this.http.put(environment.apiUrl+'/clients', client);
  }

  delete(id: number) {
      return this.http.delete(environment.apiUrl+'/clients/' + id);
  }
}
