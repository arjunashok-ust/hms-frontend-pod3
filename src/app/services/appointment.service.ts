import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { AppointmentModel } from '../models/appointment.model';
import { catchError, Observable, throwError } from 'rxjs';
import { EmployeeModel, UserModel } from '../models/user.model';

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

  handleError(error: HttpErrorResponse) {
    let message = 'Unexpected Error Occured.';
    console.log('Appointment API Error : ', message);
    if (error.message) {
      message = error.message;
    }
    return throwError(() => new Error(message));
  }
}
