import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-medical-record',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './medical-record.html',
  styleUrl: './medical-record.css',
})
export class MedicalRecordComponent {
  medicalForm: FormGroup;

  constructor(readonly fb: FormBuilder) {
    this.medicalForm = fb.group({
      patientId: [''],
      appointmentId: [''],
      doctorId: [''],
      complaint: [''],
      symptoms: [''],
      diagnosis: [''],
      medications: this.fb.array([this.createMedRow()]),
      observations: this.fb.array([this.createObsRow()]),
      notes: [''],
      createdBy: [''],
      status: [''],
    });
  }

  get medications() {
    return this.medicalForm.get('medications') as FormArray;
  }

  get observations() {
    return this.medicalForm.get('observations') as FormArray;
  }

  createMedRow(): FormGroup {
    return this.fb.group({
      name: [''],
      dosage: [''],
      frequency: [''],
      duration: [''],
    });
  }

  createObsRow(): FormGroup {
    return this.fb.group({
      metricName: [''],
      metricValue: [''],
      recordedTime: [''],
    });
  }

  addMedsRow() {
    this.medications.push(this.createMedRow());
  }

  addObsRow() {
    this.observations.push(this.createObsRow());
  }

  removeMedRow(index: number) {
    this.medications.removeAt(index);
  }

  removeObsRow(index: number) {
    this.observations.removeAt(index);
  }
}
