import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { DashboardModel } from '../models/ui.model';
import { EmployeeModel, UserModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  http: HttpClient = inject(HttpClient);

  private baseUrl = 'http://localhost:5000/hms';

  getDashboardData(): Observable<DashboardModel> {
    return this.http
      .get<DashboardModel>(`${this.baseUrl}/admin/getdashboarddata`)
      .pipe(catchError(this.handleError));
  }

  getUsers(): Observable<UserModel[]> {
    return this.http
      .get<UserModel[]>(`${this.baseUrl}/admin/getallusers`)
      .pipe(catchError(this.handleError));
  }

  getEmployees(): Observable<EmployeeModel[]> {
    return this.http
      .get<EmployeeModel[]>(`${this.baseUrl}/admin/getallemployees`)
      .pipe(catchError(this.handleError));
  }

  deleteUserProfile(data: any): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/admin/admindelete`, { body: data })
      .pipe(catchError(this.handleError));
  }

  approveUser(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/admin/acceptapproval`, data)
      .pipe(catchError(this.handleError));
  }

  rejectUser(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/admin/rejectapproval`, data)
      .pipe(catchError(this.handleError));
  }

updateEmployee(data: any): Observable<any> {
  return this.http
    .put(`${this.baseUrl}/user/updateemployee`, data)
    .pipe(catchError(this.handleError));
}

  handleError(error: HttpErrorResponse) {
    const message = error?.error?.message || 'Server Error';
    return throwError(() => new Error(message));
  }
}