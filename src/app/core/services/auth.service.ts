import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginPayload, RegisterPayload, User, AuthUserResponse } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<User | null>(null);
  private readonly apiUrl = environment.apiUrl;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  login(payload: LoginPayload): Observable<User> {
    return this.http.post<AuthUserResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      map((response) => response.data.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<AuthUserResponse>(`${this.apiUrl}/auth/register`, payload).pipe(
      map((response) => response.data.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  loadCurrentUser(): Observable<User | null> {
    const user = this.currentUser();

    if (user) {
      return of(user);
    }

    return this.http.get<AuthUserResponse>(`${this.apiUrl}/auth/me`).pipe(
      map((response) => response.data.user),
      tap((loadedUser) => this.currentUser.set(loadedUser)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.currentUser.set(null)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.currentUser.set(null);

          return of(undefined);
        }

        return throwError(() => error);
      }),
    );
  }

  clearSession(): void {
    this.currentUser.set(null);
  }
}
