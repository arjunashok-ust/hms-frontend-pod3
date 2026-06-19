import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
import { Router } from '@angular/router';

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
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  filteredDoctors: EmployeeModel[] | [] = [];
  filteredPatients: PatientModel[] | [] = [];
  filteredAppointments: AppointmentModel[] | [] = [];

  employeeId = localStorage.getItem('employeeId');

  medicalRecordCount = 0;
  completedCount = 0;
  draftCount = 0;
  deletedCount = 0;

  isLoading = false;

  totalPages = 0;
  page = 1;
  limit = 5;
  total = 0;

  medicalRecords: MedicalRecordModel[] | [] = [];

  patientMap: { [key: string]: any } = {};
  doctorMap: { [key: string]: any } = {};

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
    // attaching an event listener to appointment form control
    this.medicalForm.get('appointmentID')?.valueChanges.subscribe((value) => {
      let appointment = this.filteredAppointments.find((apt) => {
        return apt.appointmentId === value;
      });

      this.medicalForm.patchValue({
        patientId: appointment?.patientId,
        doctorId: appointment?.doctorEmployeeId,
      });
    });

    this.fetchMedicalRecordPageDetails();
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

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  goToPage(index: number) {
    this.page = index;
  }

  fetchMedicalRecordPageDetails() {
    this.medicalRecordService.getMedicalRecords(this.page, this.limit).subscribe({
      next: (res) => {
        console.log(res);
        this.totalPages = res.totalPages;
        this.medicalRecords = res.data;
        this.mapPatientAndDoctors(this.medicalRecords);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error getting appointment stats');
      },
    });
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
    if (!searchDoctorText.trim()) return;
    this.userService
      .getDoctorsBySearch(searchDoctorText)
      .pipe(debounceTime(300))
      .subscribe({
        next: (res) => {
          this.filteredDoctors = res;
          this.medicalForm.get('appointmentId')?.setValue('');
          this.getAppointments();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting doctors');
        },
      });
  }

  getPatients() {
    const searchPatientText = this.medicalForm.get('patientId')?.value;
    if (!searchPatientText.trim()) return;
    this.userService
      .getPatientsBySearch(searchPatientText)
      .pipe(debounceTime(300))
      .subscribe({
        next: (res) => {
          this.filteredPatients = res;
          this.medicalForm.get('appointmentId')?.setValue('');
          this.getAppointments();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting patients');
        },
      });
  }

  getAppointments() {
    const patientId = this.medicalForm.get('patientId')?.value ?? '';
    const doctorId = this.medicalForm.get('doctorId')?.value ?? '';
    const appointmentId = this.medicalForm.get('appointmentId')?.value ?? '';

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

  mapPatientAndDoctors(records: MedicalRecordModel[]) {
    records.forEach((record) => {
      // for patient name map
      if (!this.patientMap[record.patientId] && record.patientId) {
        this.userService.getPatientById(record.patientId).subscribe((res) => {
          this.patientMap[record.patientId] = res.name;
          this.cd.detectChanges();
        });
      }
      // for doctor name map
      if (!this.doctorMap[record.doctorId] && record.doctorId) {
        this.userService.getDoctorById(record.doctorId).subscribe((res) => {
          this.doctorMap[record.doctorId] = res.name;
          this.cd.detectChanges();
        });
      }
    });
  }

  viewMedicalRecord(medicalRecordId: string, patientName: string, doctorName: string) {
    this.router.navigate(['view-medical-record', medicalRecordId], {
      state: {
        patientName: patientName,
        doctorName: doctorName,
      },
    });
  }

  onSubmit(recordStatus: string) {
    if (!this.medicalForm.valid) return this.toast.info('Validation Failed');
    this.isLoading = true;
    const payload: MedicalRecordModel = {
      medicalRecordId: '',
      patientId: this.medicalForm.get('patientId')?.value,
      doctorId: this.medicalForm.get('doctorId')?.value,
      appointmentId: this.medicalForm.get('appointmentId')?.value,
      symptoms: this.medicalForm.get('symptoms')?.value,
      diagnosis: this.medicalForm.get('diagnosis')?.value,

      medications: this.medicalForm.get('medications')?.value,
      medicalObservations: this.medicalForm.get('observations')?.value,

      notes: this.medicalForm.get('notes')?.value,
      complaint: this.medicalForm.get('complaint')?.value,
      status: recordStatus,
      createdBy: this.medicalForm.get('createdBy')?.value,
      created_at: new Date(),
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
