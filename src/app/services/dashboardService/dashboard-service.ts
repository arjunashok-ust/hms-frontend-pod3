/**
 * @file dashboard-service.ts
 * @description
 * This file defines a dedicated service for fetching data for the dashboard.
 *
 * @overview
 * This service provides methods to retrieve aggregated statistics and employee overviews from the backend's dashboard endpoints.
 * It is used exclusively by the `Dashboard` component to populate its data cards and lists.
 *
 * Connections:
 *   DashboardComponent -> DASHBOARD-SERVICE.TS -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) { }

  getStats(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<any>(`${this.apiUrl}/api/dashboard/stats`);
    }
    return of({});
  }

  getEmployees(): Observable<any[]> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<any[]>(`${this.apiUrl}/api/dashboard/tenEmployees`);
    }
    return of([]);
  }
}
