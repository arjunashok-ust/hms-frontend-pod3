import { inject, Injectable } from '@angular/core';
import { SignUpModel } from '../models/auth.model';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  http: HttpClient = inject(HttpClient);

  private baseUrl = 'http://localhost:5000/hms';

  signUp(data: SignUpModel): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/auth/employeesignup`, data)
      .pipe(catchError(this.handleError));
  }

  login(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/auth/login`, data)
      .pipe(catchError(this.handleError));
  }

  getUiData<T>(endpoint: string): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  setPassword(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/auth/setpassword`, data)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    const message = error?.error?.message || 'Server Error';
    return throwError(() => new Error(message));
  }
}