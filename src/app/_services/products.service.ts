import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Product } from '../_models/index';

@Injectable()
export class ProductService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<Product[]>(environment.apiUrl + '/products');
    }

    getById(id: number) {
        return this.http.get(environment.apiUrl + '/products/' + id);
    }
}