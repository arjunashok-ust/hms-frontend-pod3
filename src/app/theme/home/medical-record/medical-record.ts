import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { EmployeeModel, PatientModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime } from 'rxjs';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentModel } from '../../../models/appointment.model';
import { MedicalRecordModel } from '../../../models/medical-record.model';
import { MedicalRecordService } from '../../../services/medical-record.service';

@Component({
  selector: 'app-medical-record',
  imports: [ReactiveFormsModule, CommonModule, MatAutocompleteModule],
  templateUrl: './medical-record.html',
  styleUrl: './medical-record.css',
})
export class MedicalRecordComponent implements OnInit {
  medicalForm: FormGroup;

  userService: UserService = inject(UserService);
  appointmentService: AppointmentService = inject(AppointmentService);
  medicalRecordService: MedicalRecordService = inject(MedicalRecordService);
  toast: ToastrService = inject(ToastrService);

  filteredDoctors: EmployeeModel[] | [] = [];
  filteredPatients: PatientModel[] | [] = [];
  filteredAppointments: AppointmentModel[] | [] = [];

  employeeId = localStorage.getItem('employeeId');

  searchDoctorText = '';
  searchPatientText = '';

  medicalRecordCount = 0;
  completedCount = 0;
  draftCount = 0;
  deletedCount = 0;

  isLoading = false;

  constructor(readonly fb: FormBuilder) {
    this.medicalForm = fb.group({
      patientId: ['', [Validators.required]],
      appointmentId: ['', [Validators.required]],
      doctorId: ['', [Validators.required]],
      complaint: ['', [Validators.required]],
      symptoms: ['', [Validators.required]],
      diagnosis: ['', [Validators.required]],
      medications: this.fb.array([this.createMedRow()]),
      observations: this.fb.array([this.createObsRow()]),
      notes: [''],
      createdBy: [this.employeeId, [Validators.required]],
      status: ['Completed'],
    });
  }

  ngOnInit(): void {
    this.fetchMedicalRecordStats();
    this.medicalForm.get('appointmentID')?.valueChanges.subscribe((value) => {
      let appointment = this.filteredAppointments.find((apt) => {
        return apt.appointmentId === value;
      });

      this.medicalForm.patchValue({
        patientId: appointment?.patientId,
        doctorId: appointment?.doctorEmployeeId,
      });
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

  fetchMedicalRecordStats() {
    this.medicalRecordService.getMedicalStats().subscribe({
      next: (res) => {
        this.medicalRecordCount = res.medicalRecordCount;
        this.completedCount = res.completedCount;
        this.draftCount = res.draftCount;
        this.deletedCount = res.deletedCount;
      },
      error: (error) => {
        this.toast.error(error?.error?.message || 'Error getting appointment stats');
      },
    });
  }

  getDoctors() {
    const searchDoctorText = this.medicalForm.get('doctorId')?.value;
    if (!this.searchDoctorText.trim()) return;
    this.userService
      .getDoctorsBySearch(this.searchDoctorText)
      .pipe(debounceTime(300))
      .subscribe({
        next: (res) => {
          this.filteredDoctors = res;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting doctors');
        },
      });
  }

  getPatients() {
    const searchPatientText = this.medicalForm.get('patientId')?.value;
    if (!this.searchPatientText.trim()) return;
    this.userService
      .getPatientsBySearch(this.searchPatientText)
      .pipe(debounceTime(300))
      .subscribe({
        next: (res) => {
          this.filteredPatients = res;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting patients');
        },
      });
  }

  getAppointments() {
    const patientId = this.medicalForm.get('patientId')?.value;
    const doctorId = this.medicalForm.get('doctorId')?.value;
    const appointmentId = this.medicalForm.get('appointmentId')?.value;

    this.appointmentService
      .getAppointmentByDoctorIdOrPatientId(doctorId, patientId, appointmentId)
      .pipe(debounceTime(300))
      .subscribe({
        next: (res) => {
          this.filteredAppointments = res;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting appointments');
        },
      });
  }

  onSubmit() {
    if (!this.medicalForm.valid) return this.toast.info('Validation Failed');
    this.isLoading = true;
    const payload: MedicalRecordModel = {
      patientId: this.medicalForm.get('patientId')?.value,
      doctorId: this.medicalForm.get('doctorId')?.value,
      appointmentId: this.medicalForm.get('appointmentId')?.value,
      symptoms: this.medicalForm.get('symptoms')?.value,
      diagnosis: this.medicalForm.get('diagnosis')?.value,

      medications: this.medicalForm.get('medications')?.value,
      medicalObservations: this.medicalForm.get('observations')?.value,

      notes: this.medicalForm.get('notes')?.value,
      complaint: this.medicalForm.get('complaint')?.value,

      createdBy: this.medicalForm.get('createdBy')?.value,
      createdAt: new Date(),
    };

    this.medicalRecordService.createMedicalRecord(payload).subscribe({
      next: (res) => {
        this.toast.success('Medical Record Created Sucessfully.');
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
        this.isLoading = false;
      },
    });
    this.medicalForm.reset({ createdBy: this.employeeId });
    return true;
  }
}
