import { inject, Injectable } from '@angular/core';
import { SignUpModel } from '../models/auth.model';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiUrl } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api: ApiUrl = new ApiUrl();
  http: HttpClient = inject(HttpClient);

  // signUp
  signUp(data: SignUpModel): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/auth/signUp`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // login
  login(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/auth/login`, data, {
        withCredentials: true,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Role,Departments and Specialization
  getUiData<T>(url: string): Observable<T> {
    return this.http
      .get<T>(`${this.api.backend_url + url}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // submit password for first login
  setPassword(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/auth/set-password`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get user permissions
  getPermissions(role: string): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/auth/getPermissions`, {
        params: {
          role: role,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get access token
  getAccessToken(): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/auth/refresh-token`, { withCredentials: true })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // forgot password
  resetPassword(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/auth/reset-password`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  logout(): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/auth/logout`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // error handling
  handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
