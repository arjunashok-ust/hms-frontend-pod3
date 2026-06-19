import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { MedicalRecordModel } from '../models/medical-record.model';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  http: HttpClient = inject(HttpClient);
  api: ApiUrl = new ApiUrl();

  // Medical Record Creation
  createMedicalRecord(data: MedicalRecordModel): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/medicalRecord/createMedicalRecord`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // Medical Record Stats
  getMedicalStats(): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/medicalRecord/getMedicalRecordStats`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  handleError(error: HttpErrorResponse) {
    let message = 'Unexpected Error Occured.';
    if (error?.error?.message) {
      message = error?.error?.message;
    }
    return throwError(() => new Error(message));
  }
}
