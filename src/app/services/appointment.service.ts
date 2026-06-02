import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AppointmentModel, AppointmentResponseModel } from '../models/appointment.model';
import { EmployeeModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  http: HttpClient = inject(HttpClient);

  private baseUrl = 'http://localhost:5000/hms';

  createAppointment(data: AppointmentModel): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/appointment/createappointment`, data)
      .pipe(catchError(this.handleError));
  }

  getAllAppointment(): Observable<AppointmentModel[]> {
    return this.http
      .get<AppointmentModel[]>(`${this.baseUrl}/appointment/getallappointments`)
      .pipe(catchError(this.handleError));
  }

  getAllDoctors(): Observable<EmployeeModel[]> {
    return this.http
      .get<EmployeeModel[]>(`${this.baseUrl}/appointment/getdoctors`)
      .pipe(catchError(this.handleError));
  }

  getAppointmentUiData(): Observable<AppointmentResponseModel> {
    return this.http
      .get<AppointmentResponseModel>(`${this.baseUrl}/appointment/getappointmentuidata`)
      .pipe(catchError(this.handleError));
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/appointment/deleteappointment`, {
        params: { appointmentId: id },
      })
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    const message = error?.error?.message || 'Server Error';
    return throwError(() => new Error(message));
  }
}