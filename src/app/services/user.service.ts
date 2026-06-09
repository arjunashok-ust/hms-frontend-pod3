import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { PatientModel, UserEmployeeModel } from '../models/user.model';
import { NodeModel } from '../models/ui.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserService {
  http: HttpClient = inject(HttpClient);
  api: ApiUrl = new ApiUrl();
  router: Router = inject(Router);

  // get user profile
  getUserProfile(email: string): Observable<UserEmployeeModel> {
    return this.http
      .get<UserEmployeeModel>(`${this.api.backend_url}/user/getUserProfile`, {
        params: {
          email: email,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get nodes
  getNodes(role: string): Observable<NodeModel[]> {
    return this.http
      .get<NodeModel[]>(`${this.api.backend_url}/node/getNodes`, {
        params: { role: role },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // create patient
  createPatient(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/createPatient`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get all patients
  getPatients(): Observable<PatientModel[]> {
    return this.http
      .get<PatientModel[]>(`${this.api.backend_url}/user/getPatients`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // delete patient
  deletePatient(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/deletePatient`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // logout
  logout() {
    localStorage.clear();
    return this.router.navigate(['/login']);
  }

  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
