/**
 * @file auth-service.ts
 * @description
 * This file defines the primary service for handling user authentication.
 *
 * @overview
 * This service manages the application's authentication state.
 * It handles login, signup, and token refresh operations by communicating with the backend.
 * It also manages the user's session and JWT token in local storage and provides an `isAuthenticated` check for guards and other services.
 *
 * Connections:
 *   (Components/Guards) -> AUTH-SERVICE.TS -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
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
    return this.http.post(`${this.apiUrl}/signupByUser`, userData);
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response?.accessToken) {
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('user_session', JSON.stringify(response.user));
            this.currentUserSignal.set(response.user);
          }
        }),
      );
  }

  refreshAccessToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => {
        if (response?.accessToken) {
          localStorage.setItem('token', response.accessToken);
        }
      }),
    );
  }

  logoutRemote(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  setAccessToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  clearSession() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_session');
      this.currentUserSignal.set(null);
    }
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
    this.logoutRemote().subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }
}
