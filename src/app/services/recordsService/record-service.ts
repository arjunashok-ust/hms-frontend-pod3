import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly backendUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) { }

  // Admin/Receptionist Fetch
  getAllMedicalRecords(): Observable<any[]> {
    return this.http.get<any>(`${this.backendUrl}/api/records/getAllRecords`)
      .pipe(map(res => res.data || res));
  }

  // Doctor Fetch
  getMyMedicalRecords(): Observable<any[]> {
    return this.http.get<any>(`${this.backendUrl}/api/records/getMyRecords`)
      .pipe(map(res => res.data || res));
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