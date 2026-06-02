import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {

    let token = '';

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

  }

  // AUTH
  login(body: any): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, body);
  }

  signup(body: any): Observable<any> {
    return this.http.post(`${this.base}/auth/formSignup`, body);
  }

  // DASHBOARD (MATCH YOUR BACKEND)
 getDashboardData(): Observable<any> {
  return this.http.get(`${this.base}/dashboard/stats`, {
    headers: this.headers()
  });
}


  // USERS
  // getAllUsers(): Observable<any> {
  //   return this.http.get(`${this.base}/admin/getAllUsers`, {
  //     headers: this.headers()
  //   });
  // }

  // PROFILE
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.base}/users/getcurrent`, {
      headers: this.headers()
    });
  }

  // APPOINTMENTS
  getAllAppointments(): Observable<any> {
    return this.http.get(`${this.base}/appointment/getAllAppointments`, {
      headers: this.headers()
    });
  }

  createAppointment(payload: any): Observable<any> {
    return this.http.post(`${this.base}/appointment/createAppointment`, payload, {
      headers: this.headers()
    });
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete(`${this.base}/appointment/deleteAppointment?appointmentId=${id}`, {
      headers: this.headers()
    });
  }

  // PATIENTS
  getAllPatients(): Observable<any> {
    return this.http.get(`${this.base}/patients/getAllPatients`, {
      headers: this.headers()
    });
  }

  createPatient(body: any): Observable<any> {
    return this.http.post(`${this.base}/patients/createPatient`, body, {
      headers: this.headers()
    });
  }

  deletePatient(id: string): Observable<any> {
    return this.http.delete(`${this.base}/patients/deletePatient/${id}`, {
      headers: this.headers()
    });
  }

}