import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiUrl } from '../environment/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { EmployeeModel, PatientModel, UserEmployeeModel } from '../models/user.model';
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
      .post(`${this.api.backend_url}/auth/patientSignUp`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get all patients
  getPatients(selectedText: string, page: number, limit: number): Observable<any> {
    return this.http
      .get(`${this.api.backend_url}/user/getPatients`, {
        params: {
          selectedText,
          page,
          limit,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // delete patient
  deletePatient(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/deletePatient`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get user profile
  getPatientProfile(email: string): Observable<PatientModel> {
    return this.http
      .get<PatientModel>(`${this.api.backend_url}/user/getPatientProfile`, {
        params: {
          email: email,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get patients by search
  getPatientsBySearch(searchText: string): Observable<PatientModel[]> {
    return this.http
      .get<PatientModel[]>(`${this.api.backend_url}/user/getPatientsBySearch`, {
        params: {
          searchText: searchText,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get doctors by search
  getDoctorsBySearch(searchText: string): Observable<EmployeeModel[]> {
    return this.http
      .get<EmployeeModel[]>(`${this.api.backend_url}/user/getDoctorsBySearch`, {
        params: {
          searchText: searchText,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // update patient profile
  updatePatientProfile(data: any): Observable<any> {
    return this.http
      .post(`${this.api.backend_url}/user/updatePatientProfile`, data)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get doctor by id
  getDoctorById(doctorId: string): Observable<EmployeeModel> {
    return this.http
      .get<EmployeeModel>(`${this.api.backend_url}/user/getDoctorById`, {
        params: {
          doctorId,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get patient by id
  getPatientById(patientId: string): Observable<PatientModel> {
    return this.http
      .get<PatientModel>(`${this.api.backend_url}/user/getPatientById`, {
        params: {
          patientId,
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  // get single user
  getSingleUser(email: string): Observable<UserEmployeeModel> {
    return this.http
      .get<UserEmployeeModel>(`${this.api.backend_url}/user/getSingleUser`, {
        params: {
          email,
        },
      })
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
