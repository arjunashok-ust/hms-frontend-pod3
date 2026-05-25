import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { DashboardModel } from '../models/ui.model';
import { EmployeeModel, UserModel, UserResponseModel } from '../models/user.model';
import { SignUpModel } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  http: HttpClient = inject(HttpClient);
  apiUrl: ApiUrl = new ApiUrl();

  getDashboardData(): Observable<DashboardModel> {
    return this.http
      .get<DashboardModel>(`${this.apiUrl.backend_url}/admin/getDashboardData`)
      .pipe(catchError(this.handleError));
  }

  getUsers(): Observable<UserModel[]> {
    return this.http
      .get<UserModel[]>(`${this.apiUrl.backend_url}/admin/getAllUsers`)
      .pipe(catchError(this.handleError));
  }

  getEmployees(): Observable<EmployeeModel[]> {
    return this.http
      .get<EmployeeModel[]>(`${this.apiUrl.backend_url}/admin/getAllUsers`)
      .pipe(catchError(this.handleError));
  }

  deleteUserProfile(data: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl.backend_url}/admin/deleteUserProfile`, data)
      .pipe(catchError(this.handleError));
  }

  getUsersData(): Observable<UserResponseModel[]> {
    return this.http
      .get<UserResponseModel[]>(`${this.apiUrl.backend_url}/admin/getUsers`)
      .pipe(catchError(this.handleError));
  }

  // signUp
  signUpAdmin(data: SignUpModel): Observable<any> {
    return this.http
      .post(`${this.apiUrl.backend_url}/auth/signUpAdmin`, data)
      .pipe(catchError(this.handleError));
  }

  // approve user profile
  approveUser(data: any): Observable<any> {
    console.log();
    return this.http
      .post(`${this.apiUrl.backend_url}/admin/approveUser`, data)
      .pipe(catchError(this.handleError));
  }

  // reject user profile
  rejectUser(data: any): Observable<any> {
    console.log(data);
    return this.http
      .post(`${this.apiUrl.backend_url}/admin/rejectUser`, data)
      .pipe(catchError(this.handleError));
  }

  // update user profile
  updateUserProfile(data: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl.backend_url}/admin/updateUserProfile`, data)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    console.log('API Error : ', error);
    let message = `Error Connecting Server!`;
    if (error.error?.message) {
      message = error.error?.message;
    }
    return throwError(() => new Error(message));
  }
}
