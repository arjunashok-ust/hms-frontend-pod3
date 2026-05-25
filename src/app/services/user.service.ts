import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { PatientModel, UserModel } from '../models/user.model';
import { NodeModel } from '../models/ui.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserService {
  http: HttpClient = inject(HttpClient);
  api: ApiUrl = new ApiUrl();
  router: Router = inject(Router);

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

  // create patient
  createPatient(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/createPatient`, data)
      .pipe(catchError(this.handleError));
  }

  // get all patients
  getPatients(): Observable<PatientModel[]> {
    return this.http
      .get<PatientModel[]>(`${this.api.backend_url}/user/getPatients`)
      .pipe(catchError(this.handleError));
  }

  // delete patient
  deletePatientt(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/deletePatient`, data)
      .pipe(catchError(this.handleError));
  }

  // logout
  logout() {
    return this.router.navigate(['/login']);
  }

  handleError(err: HttpErrorResponse) {
    let message = 'Unexpected error happend!';
    if (err.error?.message) {
      message = err.error.message;
    }

    return throwError(() => new Error(message));
  }
}
