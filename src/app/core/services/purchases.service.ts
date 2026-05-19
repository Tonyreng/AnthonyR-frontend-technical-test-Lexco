import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreatePurchasePayload, CreatePurchaseResponse } from '../models/purchase';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(payload: CreatePurchasePayload): Observable<CreatePurchaseResponse> {
    return this.http.post<CreatePurchaseResponse>(`${this.apiUrl}/purchases`, payload);
  }
}
