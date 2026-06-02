import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { PatientModel } from '../models/user.model';
import { NodeModel } from '../models/ui.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserService {
  http: HttpClient = inject(HttpClient);
  router: Router = inject(Router);

  private baseUrl = 'http://localhost:5000/hms';

  getUserProfile(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/user/profile`)
      .pipe(catchError(this.handleError));
  }

  getNodes(role: string): Observable<NodeModel[]> {
    return this.http
      .get<NodeModel[]>(`${this.baseUrl}/node/getnodes`, {
        params: { role },
      })
      .pipe(catchError(this.handleError));
  }

  createPatient(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/user/createpatient`, data)
      .pipe(catchError(this.handleError));
  }

  getPatients(): Observable<PatientModel[]> {
    return this.http
      .get<PatientModel[]>(`${this.baseUrl}/user/getpatients`)
      .pipe(catchError(this.handleError));
  }

  deletePatient(data: any): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/user/deletepatient`, {
        body: data,
      })
      .pipe(catchError(this.handleError));
  }

  logout() {
    localStorage.clear();
    return this.router.navigate(['/login']);
  }

  handleError(err: HttpErrorResponse) {
    const message = err?.error?.message || 'Server Error';
    return throwError(() => new Error(message));
  }
}