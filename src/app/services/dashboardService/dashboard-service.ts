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
  ) {}

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
