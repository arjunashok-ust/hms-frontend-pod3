import { inject, Injectable } from '@angular/core';
import { LoginModel,SignUpModel } from '../models/auth.model';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiUrl } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api: ApiUrl = new ApiUrl();
  http: HttpClient = inject(HttpClient);
  // signUp
  signUp(data: SignUpModel): Observable<any> {
    console.log(data);
    return this.http
      .post(`${this.api.backend_url}/auth/signUp`, data)
      .pipe(catchError(this.handleError));
  }
  // login
  login(data: LoginModel): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/auth/login`, data)
      .pipe(catchError(this.handleError));
  }
  // Role,Departments and Specialization
  getUiData<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.api.backend_url + url}`).pipe(catchError(this.handleError));
  }
  // error handling
  handleError(error: HttpErrorResponse) {
    console.log('API Error : ', error);
    let message = `Error Connecting Server!`;
    if (error.error?.message) {
      message = error.error?.message;
    }
    return throwError(() => new Error(message));
  }
}
