import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

function buildParams(params?: Record<string, any>): HttpParams {
  let httpParams = new HttpParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
  }
  return httpParams;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  readonly apiUrl = `${environment.apiBaseUrl}/api/emp`;
  readonly patientUrl = `${environment.apiBaseUrl}/api/patient`;
  readonly appointmentUrl = `${environment.apiBaseUrl}/api/appointment`;
  readonly nodeUrl = `${environment.apiBaseUrl}/api/node`;
  readonly medicalRecordUrl = `${environment.apiBaseUrl}/api/medical-record`;
  readonly roleUrl = `${environment.apiBaseUrl}/api/role`;

  readonly userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(readonly http: HttpClient) {}

  /* LOGIN — withCredentials so the server can set the httpOnly refresh cookie */
  login(data: any) {
    return this.http.post(`${this.apiUrl}/login`, data, { withCredentials: true });
  }

  /* REFRESH ACCESS TOKEN — sends the httpOnly refresh cookie, gets a new access token */
  refresh() {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  /* LOGOUT — revokes the refresh session server-side and clears the cookie */
  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  /* FORM SIGNUP */
  formSignup(data: any) {
    return this.http.post(`${this.apiUrl}/formSignUp`, data);
  }

  /* ADMIN SIGNUP */
  adminSignup(data: any) {
    return this.http.post(`${this.apiUrl}/signup`, data);
  }

  /* CURRENT USER */
  getCurrentUser() {
    return this.http.get(`${this.apiUrl}/currentUser`);
  }

  /* DASHBOARD */
  getDashboardStats() {
    return this.http.get(`${this.apiUrl}/dashboard-stats`);
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
  getEmployees(params?: { page?: number; limit?: number }) {
    return this.http.get(`${this.apiUrl}/employees`, { params: buildParams(params) });
  }

  deleteEmployee(employeeId: string) {
    return this.http.delete(`${this.apiUrl}/deleteEmployee/${employeeId}`);
  }

  /* RESET PASSWORD */
  resetPassword(data: any) {
    return this.http.put(`${this.apiUrl}/reset-password`, data);
  }

  /* PATIENT */
  createPatient(data: any) {
    return this.http.post(`${this.patientUrl}/createPatient`, data);
  }

  getAllPatients(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return this.http.get(`${this.patientUrl}/getAllPatients`, { params: buildParams(params) });
  }

  getSinglePatient(patientId: string) {
    return this.http.get(`${this.patientUrl}/getSinglePatient/${patientId}`);
  }

  updatePatient(patientId: string, data: any) {
    return this.http.put(`${this.patientUrl}/updatePatient/${patientId}`, data);
  }

  deletePatient(patientId: string) {
    return this.http.delete(`${this.patientUrl}/deletePatient/${patientId}`);
  }

  getPatientUI() {
    return this.http.get(`${this.patientUrl}/getPatientUI`);
  }

  /* APPOINTMENT */
  createAppointment(data: any) {
    return this.http.post(`${this.appointmentUrl}/createAppointment`, data);
  }

  getAllAppointments(params?: { page?: number; limit?: number; status?: string }) {
    return this.http.get(`${this.appointmentUrl}/getAllAppointments`, { params: buildParams(params) });
  }

  getDoctors(params?: { page?: number; limit?: number }) {
    return this.http.get(`${this.appointmentUrl}/getDoctors`, { params: buildParams(params) });
  }

  deleteAppointment(appointmentId: string) {
    return this.http.delete(`${this.appointmentUrl}/deleteAppointment/${appointmentId}`);
  }
  approveAppointment(appointmentId: string) {
    return this.http.put(`${this.appointmentUrl}/approveAppointment/${appointmentId}`, {});
  }

  rejectAppointment(appointmentId: string) {
    return this.http.put(`${this.appointmentUrl}/rejectAppointment/${appointmentId}`, {});
  }

  getAppointmentUI() {
    return this.http.get(`${this.appointmentUrl}/getAppointmentUI`);
  }

  getPendingApprovals(params?: { page?: number; limit?: number }) {
    return this.http.get(`${this.apiUrl}/pendingApprovals`, { params: buildParams(params) });
  }

  approveEmployee(employeeId: string) {
    return this.http.put(`${this.apiUrl}/approveEmployee/${employeeId}`, {});
  }

  rejectEmployee(employeeId: string) {
    return this.http.delete(`${this.apiUrl}/rejectEmployee/${employeeId}`);
  }

  getApprovalStats() {
    return this.http.get(`${this.apiUrl}/approvalStats`);
  }

  updateEmployee(employeeId: string, data: any) {
    return this.http.put(`${this.apiUrl}/updateEmployee/${employeeId}`, data);
  }

  /* SELF-SERVICE PROFILE UPDATE */
  updateProfile(employeeId: string, data: any) {
    return this.http.put(`${this.apiUrl}/updateProfile/${employeeId}`, data);
  }

  /* APPOINTMENT EDIT */
  updateAppointment(appointmentId: string, data: any) {
    return this.http.put(`${this.appointmentUrl}/updateAppointment/${appointmentId}`, data);
  }

  /* NODES (sidebar) */
  getNodes() {
    return this.http.get(`${this.nodeUrl}`);
  }

  /* MEDICAL RECORDS */
  createMedicalRecord(data: any) {
    return this.http.post(`${this.medicalRecordUrl}/createMedicalRecord`, data);
  }

  getMedicalRecords(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorEmployeeId?: string;
    appointmentId?: string;
    status?: string;
  }) {
    return this.http.get(`${this.medicalRecordUrl}/getMedicalRecords`, { params: buildParams(params) });
  }

  updateMedicalRecord(recordId: string, data: any) {
    return this.http.put(`${this.medicalRecordUrl}/updateMedicalRecord/${recordId}`, data);
  }

  deleteMedicalRecord(recordId: string) {
    return this.http.delete(`${this.medicalRecordUrl}/deleteMedicalRecord/${recordId}`);
  }

  /* ROLE MANAGEMENT */
  getRoles() {
    return this.http.get(`${this.roleUrl}`);
  }

  getRole(roleId: string) {
    return this.http.get(`${this.roleUrl}/${roleId}`);
  }

  createRole(data: any) {
    return this.http.post(`${this.roleUrl}`, data);
  }

  updateRole(roleId: string, data: any) {
    return this.http.put(`${this.roleUrl}/${roleId}`, data);
  }

  deleteRole(roleId: string) {
    return this.http.delete(`${this.roleUrl}/${roleId}`);
  }

  /* NODE MANAGEMENT */
  getNode(nodeId: string) {
    return this.http.get(`${this.nodeUrl}/${nodeId}`);
  }

  createNode(data: any) {
    return this.http.post(`${this.nodeUrl}`, data);
  }

  updateNode(nodeId: string, data: any) {
    return this.http.put(`${this.nodeUrl}/${nodeId}`, data);
  }

  deleteNode(nodeId: string) {
    return this.http.delete(`${this.nodeUrl}/${nodeId}`);
  }
}
