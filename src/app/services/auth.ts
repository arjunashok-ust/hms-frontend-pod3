import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  readonly apiUrl = 'http://localhost:5000/api/emp';
  readonly patientUrl = 'http://localhost:5000/api/patient';
  readonly appointmentUrl = 'http://localhost:5000/api/appointment';

  readonly userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(readonly http: HttpClient) {}

  /* TOKEN */
  private getToken() {
    if (globalThis.window) {
      return localStorage.getItem('token') || '';
    }
    return '';
  }

  /* HEADERS */
  private getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.getToken()}`,
      }),
    };
  }

  /* LOGIN */
  login(data: any) {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  /* FORM SIGNUP */
  formSignup(data: any) {
    return this.http.post(`${this.apiUrl}/formSignUp`, data);
  }

  /* ADMIN SIGNUP */
  adminSignup(data: any) {
    return this.http.post(`${this.apiUrl}/signup`, data, this.getHeaders());
  }

  /* CURRENT USER */
  getCurrentUser() {
    return this.http.get(`${this.apiUrl}/currentUser`, this.getHeaders());
  }

  /* DASHBOARD */
  getDashboardStats() {
    return this.http.get(`${this.apiUrl}/dashboard-stats`, this.getHeaders());
  }

  /* LOAD USER */
  loadUser() {
     if (globalThis.window) {
      const token = localStorage.getItem('token');

      if (token) {
        this.getCurrentUser().subscribe({
          next: (res: any) => {
            console.log(res);
            this.userSubject.next(res);
          },
          error: () => {
            this.userSubject.next(null);
          },
        });
      } else {
        this.userSubject.next(null);
      }
    }
  }

  /* USER OBSERVABLE */
  getUser() {
    return this.user$;
  }

  /* EMPLOYEES */
  getEmployees() {
    return this.http.get(`${this.apiUrl}/employees`, this.getHeaders());
  }

  deleteEmployee(employeeId: string) {
    return this.http.delete(`${this.apiUrl}/deleteEmployee/${employeeId}`, this.getHeaders());
  }

  /* RESET PASSWORD */
  resetPassword(data: any) {
    return this.http.put(`${this.apiUrl}/reset-password`, data, this.getHeaders());
  }

  /* PATIENT */
  createPatient(data: any) {
    return this.http.post(`${this.patientUrl}/createPatient`, data, this.getHeaders());
  }

  getAllPatients() {
    return this.http.get(`${this.patientUrl}/getAllPatients`, this.getHeaders());
  }

  getSinglePatient(patientId: string) {
    return this.http.get(`${this.patientUrl}/getSinglePatient/${patientId}`, this.getHeaders());
  }

  updatePatient(patientId: string, data: any) {
    return this.http.put(`${this.patientUrl}/updatePatient/${patientId}`, data, this.getHeaders());
  }

  deletePatient(patientId: string) {
    return this.http.delete(`${this.patientUrl}/deletePatient/${patientId}`, this.getHeaders());
  }

  getPatientUI() {
    return this.http.get(`${this.patientUrl}/getPatientUI`, this.getHeaders());
  }

  /* APPOINTMENT */
  createAppointment(data: any) {
    return this.http.post(`${this.appointmentUrl}/createAppointment`, data, this.getHeaders());
  }

  getAllAppointments() {
    return this.http.get(`${this.appointmentUrl}/getAllAppointments`, this.getHeaders());
  }

  getDoctors() {
    return this.http.get(`${this.appointmentUrl}/getDoctors`, this.getHeaders());
  }

  deleteAppointment(appointmentId: string) {
    return this.http.delete(
      `${this.appointmentUrl}/deleteAppointment/${appointmentId}`,
      this.getHeaders(),
    );
  }

  getAppointmentUI() {
    return this.http.get(`${this.appointmentUrl}/getAppointmentUI`, this.getHeaders());
  }

  getPendingApprovals() {
    return this.http.get(`${this.apiUrl}/pendingApprovals`, this.getHeaders());
  }

  approveEmployee(employeeId: string) {
    return this.http.put(`${this.apiUrl}/approveEmployee/${employeeId}`, {}, this.getHeaders());
  }

  getApprovalStats() {
    return this.http.get(`${this.apiUrl}/approvalStats`, this.getHeaders());
  }
}
