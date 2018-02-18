import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Client, Price } from '../_models/index';

@Injectable()
export class ClientService {

    constructor(private http: HttpClient) { }
    getAll() {
        return this.http.get<Client[]>(environment.apiUrl + '/clients', {})
    }

    getById(client_id: number) {
        return this.http.get(environment.apiUrl + '/clients/' + client_id);
    }

    create(client: Client) {
        return this.http.post(environment.apiUrl + '/clients', client);
    }

    update(client: Client) {
        return this.http.put(environment.apiUrl + '/clients', client);
    }

    delete(id: number) {
        return this.http.delete(environment.apiUrl + '/clients/' + id);
    }

    getPricesByClientId(client_id: number) {
        return this.http.get<Price[]>(environment.apiUrl + '/clients/prices/' + client_id, {})
    }

    savePrices(client_id: number, prices: Price[]) {
        return this.http.put(environment.apiUrl + '/clients/prices/save/' + client_id, prices);
    }
}
