import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments';

export interface MenuNode {
  _id?: string;
  name: string;
  key: string;
  path: string;
  icon?: string;
  rolesAllowed?: string[];
  order?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly backendUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) { }

  getMenus(): Observable<MenuNode[]> {
    return this.http.get<MenuNode[]>(`${this.backendUrl}/api/menuNode/getMenus`);
  }

  getCurrentUser() {
    let headers = new HttpHeaders();

    if (globalThis.window !== undefined && globalThis.localStorage) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return this.http.get(`${this.backendUrl}/api/profile/me`, { headers });
  }

  changeFirstPassword(payload: any) {
    return this.http.post(`${this.backendUrl}/api/auth/setpassword`, payload);
  }

  getAllEmployees(params: any = {}) {
    return this.http.get(`${this.backendUrl}/api/employees/all`, { params });
  }

  updateEmployee(employeeCode: string, payload: any) {
    return this.http.put(`${this.backendUrl}/api/employees/${employeeCode}`, payload);
  }

  deleteEmployee(employeeCode: string) {
    return this.http.delete(`${this.backendUrl}/api/employees/${employeeCode}`);
  }

  createEmployeeByAdmin(payload: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/api/employees/create`, payload);
  }

  approveEmployee(employeeCode: string): Observable<any> {
    return this.http.patch(`${this.backendUrl}/api/employees/approve/${employeeCode}`, {});
  }

  rejectEmployee(employeeCode: string): Observable<any> {
    return this.http.patch(`${this.backendUrl}/api/employees/reject/${employeeCode}`, {});
  }

  getAllPatients(params: any = {}) {
    return this.http.get(`${this.backendUrl}/api/patients/all`, { params });
  }

  updatePatient(employeeCode: string, payload: any) {
    return this.http.put(`${this.backendUrl}/api/patients/${employeeCode}`, payload);
  }

  deletePatient(employeeCode: string) {
    return this.http.delete(`${this.backendUrl}/api/patients/${employeeCode}`);
  }

  createPatient(payload: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/api/patients/create`, payload);
  }

  checkRoutePermission(path: string): Observable<boolean> {
    return this.http
      .get<{ allowed: boolean }>(`${this.backendUrl}/api/menuNode/check-permission/${path}`)
      .pipe(
        map((res) => res.allowed),
        catchError(() => of(false)),
      );
  }

  // --- ROLES & PERMISSIONS ---
  getAllRoles() {
    return this.http.get(`${this.backendUrl}/api/roles/show`);
  }

  updateRole(id: string, payload: { roleName: string, rolePermissions: string[] }) {
    return this.http.put(`${this.backendUrl}/api/roles/${id}`, payload);
  }

  getPermissions() {
    return this.http.get(`${this.backendUrl}/api/permissions`);
  }

  createPermission(payload: { name: string }) {
    return this.http.post(`${this.backendUrl}/api/permissions`, payload);
  }

  // Note: For assigning/revoking, you can use these individual endpoints, 
  // but to match the "Save Changes" button in your UI, using the bulk `updateRole` is much more efficient!
  assignPermission(payload: { roleId: string, permissionName: string }) {
    return this.http.post(`${this.backendUrl}/api/permissions/assign`, payload);
  }

  revokePermission(payload: { roleId: string, permissionName: string }) {
    return this.http.post(`${this.backendUrl}/api/permissions/revoke`, payload);
  }

}
