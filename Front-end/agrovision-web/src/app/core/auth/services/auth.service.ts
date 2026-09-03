import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:8080/api/auth';

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';

  login(credentials: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.API_URL}/login`,
      credentials
    ).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify({
          userId: response.userId,
          username: response.username,
          role: response.role
        }));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): LoginResponse | null {

    const token = this.getToken();
    const user = localStorage.getItem(this.USER_KEY);

    if (!token || !user) {
      return null;
    }

    return {
      token,
      ...JSON.parse(user)
    };
  }
}