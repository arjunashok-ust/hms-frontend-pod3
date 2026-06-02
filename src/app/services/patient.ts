import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class PatientService {

  constructor(private http: HttpClient) {}

  getPatients() {

    return this.http.get(
      'http://localhost:3000/api/patients'
    );

  }

}