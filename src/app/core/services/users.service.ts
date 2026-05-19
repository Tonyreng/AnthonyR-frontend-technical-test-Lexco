import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUserPayload, UpdateUserPayload, UserListQuery, UserResponse, UsersResponse } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(query: UserListQuery = {}): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users`, {
      params: this.buildParams(query),
    });
  }

  create(payload: CreateUserPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users`, payload);
  }

  update(userId: number, payload: UpdateUserPayload): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/users/${userId}`, payload);
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  private buildParams(query: UserListQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return params;
      }

      return params.set(key, String(value));
    }, new HttpParams());
  }
}
