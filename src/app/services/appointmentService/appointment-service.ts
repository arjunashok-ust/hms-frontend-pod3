import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiUrl = environment.apiUrl

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) { }

  getStats(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) return this.http.get<any>(`${this.apiUrl}/api/appointment/stats`);
    return of({});
  }

  getDoctors(): Observable<any[]> {
    if (isPlatformBrowser(this.platformId)) return this.http.get<any[]>(`${this.apiUrl}/api/appointment/doctors`);
    return of([]);
  }

  getRecentAppointments(): Observable<any[]> {
    if (isPlatformBrowser(this.platformId)) return this.http.get<any[]>(`${this.apiUrl}/api/appointment/recent`);
    return of([]);
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

  getAvailableSlots(doctorId: string, date: string): Observable<string[]> {
    let headers = new HttpHeaders();

    if (globalThis.window !== undefined && globalThis.localStorage) {
      const token = localStorage.getItem('token');
      if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return this.http.get<string[]>(`${this.apiUrl}/api/appointment/slots?doctorId=${doctorId}&date=${date}`, { headers });
  }
}