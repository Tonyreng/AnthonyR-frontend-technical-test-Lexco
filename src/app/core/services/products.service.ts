import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CatalogProductListQuery,
  CatalogProductsResponse,
  CreateProductPayload,
  ProductListQuery,
  ProductResponse,
  ProductsResponse,
  UpdateProductPayload,
} from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(query: ProductListQuery = {}): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.apiUrl}/products`, {
      params: this.buildParams(query),
    });
  }

  listAvailable(query: CatalogProductListQuery = {}): Observable<CatalogProductsResponse> {
    return this.http.get<CatalogProductsResponse>(`${this.apiUrl}/catalog/products`, {
      params: this.buildParams(query),
    });
  }

  get(productId: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/products/${productId}`);
  }

  create(payload: CreateProductPayload): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.apiUrl}/products`, payload);
  }

  update(productId: number, payload: UpdateProductPayload): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/products/${productId}`, payload);
  }

  delete(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${productId}`);
  }

  private buildParams(query: ProductListQuery | CatalogProductListQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return params;
      }

      return params.set(key, String(value));
    }, new HttpParams());
  }
}
