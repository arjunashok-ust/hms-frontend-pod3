import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppointmentService {

  http = inject(HttpClient);

  baseUrl = 'http://localhost:3000/api';

  createAppointment(data: any) {
    return this.http.post(`${this.baseUrl}/appointments/create`, data);
  }

  getAllAppointment() {
    return this.http.get<any[]>(`${this.baseUrl}/appointments`);
  }

  getAllDoctors() {
    return this.http.get<any[]>(`${this.baseUrl}/employees`);
  }

  getAppointmentUiData() {
    return this.http.get<any>(`${this.baseUrl}/appointments/stats`);
  }

  deleteAppointment(id: string) {
    return this.http.delete(`${this.baseUrl}/appointments/${id}`);
  }
}
``