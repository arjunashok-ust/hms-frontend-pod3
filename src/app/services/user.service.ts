import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { UserModel } from '../models/user.model';
import { NodeModel } from '../models/ui.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  http: HttpClient = inject(HttpClient);
  api: ApiUrl = new ApiUrl();

  // get user profile
  getUserProfile(email: string): Observable<any> {
    return this.http
      .get<UserModel>(`${this.api.backend_url}/user/getUserProfile`, {
        params: {
          email: email,
        },
      })
      .pipe(catchError(this.handleError));
  }

  // get nodes
  getNodes(role: string): Observable<NodeModel[]> {
    return this.http
      .get<NodeModel[]>(`${this.api.backend_url}/node/getNodes`, {
        params: { role: role },
      })
      .pipe(catchError(this.handleError));
  }

  // get name by employee id
  getNameByEmployeeId(employeeId: string): Observable<any> {
    return this.http
      .get<any>(`${this.api.backend_url}/user/getNameByEmployeeId`, {
        params: { employeeId: employeeId },
      })
      .pipe(catchError(this.handleError));
  }

  // get name by patient id
  getNameByPatientId(patientId: string): Observable<any> {
    return this.http
      .get<any>(`${this.api.backend_url}/user/getNameByPatientId`, {
        params: { patientId: patientId },
      })
      .pipe(catchError(this.handleError));
  }

  handleError(err: HttpErrorResponse) {
    let message = 'Unexpected error happend!';
    if (err.error?.message) {
      message = err.error.message;
    }

    return throwError(() => new Error(message));
  }
}
