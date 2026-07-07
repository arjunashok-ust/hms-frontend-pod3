/**
 * @file record-service.ts
 * @description
 * This file defines a dedicated service for all medical record-related API calls.
 *
 * @overview
 * This service encapsulates the logic for communicating with the backend's medical record endpoints.
 * It provides methods for creating, reading, updating, and deleting records, including role-specific fetch methods (`getAllMedicalRecords` vs. `getMyMedicalRecords`).
 *
 * Connections:
 *   MedicalRecordComponent -> RECORD-SERVICE.TS -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly backendUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) { }


  getAllMedicalRecords(params: any = {}): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/api/records/getAllRecords`, { params });
  }


  getMyMedicalRecords(params: any = {}): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/api/records/getMyRecords`, { params });
  }

  getMedicalRecordById(id: string): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/api/records/getRecord/${id}`)
      .pipe(map(res => res.data || res));
  }

  createMedicalRecord(payload: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/api/records/createRecord`, payload);
  }

  updateMedicalRecord(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/api/records/updateRecord/${id}`, payload);
  }

  deleteMedicalRecord(id: string): Observable<any> {
    return this.http.delete(`${this.backendUrl}/api/records/deleteRecord/${id}`);
  }
}