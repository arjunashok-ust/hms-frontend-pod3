import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { AppointmentModel, AppointmentResponseModel } from '../models/appointment.model';
import { catchError, Observable, throwError } from 'rxjs';
import { EmployeeModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  http: HttpClient = inject(HttpClient);
  api: ApiUrl = new ApiUrl();

  // create appointment
  createAppointment(data: AppointmentModel): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/appointment/createAppointment`, data)
      .pipe(catchError(this.handleError));
  }

  // get all appointments
  getAllAppointment(): Observable<AppointmentModel[]> {
    return this.http
      .get<AppointmentModel[]>(`${this.api.backend_url}/appointment/getAllAppointments`)
      .pipe(catchError(this.handleError));
  }

  // get all doctors
  getAllDoctors(): Observable<EmployeeModel[]> {
    return this.http
      .get<EmployeeModel[]>(`${this.api.backend_url}/appointment/getDoctors`)
      .pipe(catchError(this.handleError));
  }

  // get appointment ui data
  getAppointmentUiData(): Observable<AppointmentResponseModel> {
    return this.http
      .get<AppointmentResponseModel>(`${this.api.backend_url}/appointment/getAppointmentUiData`)
      .pipe(catchError(this.handleError));
  }

  // delete appointment
  deleteAppointment(appointmentId: string): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/appointment/deleteAppointment`, {
        params: { appointmentId: appointmentId },
      })
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    let message = 'Unexpected Error Occured.';
    console.log('Appointment API Error : ', message);
    if (error.message) {
      message = error.message;
    }
    return throwError(() => new Error(message));
  }
}
