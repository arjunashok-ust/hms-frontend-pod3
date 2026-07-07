/**
 * @file appointment-service.ts
 * @description
 * This file defines a dedicated service for all appointment-related API calls.
 *
 * @overview
 * This service encapsulates the logic for communicating with the backend's appointment endpoints.
 * It provides methods for fetching statistics, doctor lists, available slots, and performing CRUD operations on appointments.
 *
 * Connections:
 *   (Components) -> APPOINTMENT-SERVICE.TS -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) { }

  getStats(): Observable<any> {
    if (isPlatformBrowser(this.platformId))
      return this.http.get<any>(`${this.apiUrl}/api/appointment/stats`);
    return of({});
  }

  getDoctors(): Observable<any[]> {
    if (isPlatformBrowser(this.platformId))
      return this.http.get<any[]>(`${this.apiUrl}/api/appointment/doctors`);
    return of([]);
  }

  getRecentAppointments(params: any = {}): Observable<any> {
    if (isPlatformBrowser(this.platformId))
      return this.http.get<any>(`${this.apiUrl}/api/appointment/recent`, { params });
    return of({ data: [], pagination: { total: 0, pages: 1 } });
  }

  updateAppointment(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/appointment/${id}`, data);
  }

  bookAppointment(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/appointment/create`, data);
  }

  deleteAppointment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/appointment/${id}`);
  }

  cancelAppointment(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/appointment/${id}`, data);
  }

  getAvailableSlots(doctorId: string, date: string): Observable<string[]> {
    let headers = new HttpHeaders();

    if (globalThis.window !== undefined && globalThis.localStorage) {
      const token = localStorage.getItem('token');
      if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<string[]>(
      `${this.apiUrl}/api/appointment/slots?doctorId=${doctorId}&date=${date}`,
      { headers },
    );
  }
  getAllAppointments(): Observable<any> { return this.http.get(`${this.apiUrl}/api/appointment/all`); }

}
