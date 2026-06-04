import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';
  private readonly profileUrl = '/api/profile';
  private readonly platformId = inject(PLATFORM_ID);
  currentUserSignal = signal<any>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        this.currentUserSignal.set(JSON.parse(savedSession));
      }
    }
  }

  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user_session', JSON.stringify(response.user));
          this.currentUserSignal.set(response.user);
        }
      }),
    );
  }

  getCurrentUser(): any {
    if (this.currentUserSignal()) {
      return this.currentUserSignal();
    }
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      this.currentUserSignal.set(parsed);
      return parsed;
    }
    return null;
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.profileUrl}/me`).pipe(
      tap((user) => {
        localStorage.setItem('user_session', JSON.stringify(user));
        this.currentUserSignal.set(user);
      }),
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    this.currentUserSignal.set(null);
  }
}
