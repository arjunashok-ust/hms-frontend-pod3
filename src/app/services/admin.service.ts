import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { DashboardModel } from '../models/ui.model';
import { UserModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  http: HttpClient = inject(HttpClient);
  apiUrl: ApiUrl = new ApiUrl();

  getDashboardData(): Observable<DashboardModel> {
    return this.http
      .get<DashboardModel>(`${this.apiUrl.backend_url}/admin/getDashboardData`)
      .pipe(catchError(this.handleError));
  }

  getUsers(): Observable<UserModel[]>{
    return this.http.get<UserModel[]>(`${this.apiUrl.backend_url}/admin/getAllUsers`).pipe(catchError(this.handleError));
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
