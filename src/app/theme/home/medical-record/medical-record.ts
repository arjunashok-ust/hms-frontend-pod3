import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';

@Component({
  selector: 'app-medical-record',
  imports: [ReactiveFormsModule, CommonModule, MatAutocompleteModule, HasPermissionDirective],
  templateUrl: './medical-record.html',
  styleUrl: './medical-record.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalRecordComponent implements OnInit {
  medicalForm: FormGroup;

  userService: UserService = inject(UserService);
  appointmentService: AppointmentService = inject(AppointmentService);
  medicalRecordService: MedicalRecordService = inject(MedicalRecordService);
  router: Router = inject(Router);
  editRoute: ActivatedRoute = inject(ActivatedRoute);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  filteredDoctors: EmployeeModel[] | [] = [];
  filteredPatients: PatientModel[] | [] = [];
  filteredAppointments: AppointmentModel[] | [] = [];

  employeeId = localStorage.getItem('employeeId');
  role = localStorage.getItem('role');

  medicalRecordCount = 0;
  completedCount = 0;
  draftCount = 0;
  deletedCount = 0;

  isCreateLoading = false;
  isDraftLoading = false;
  isEditable = false;

  totalPages = 0;
  page = 1;
  limit = 5;
  total = 0;

  medicalRecords: MedicalRecordModel[] | [] = [];
  medicalRecord: MedicalRecordModel | null = null;
  medicalRecordId = '';

  patientMap: { [key: string]: string } = {};
  doctorMap: { [key: string]: string } = {};

  constructor(readonly fb: FormBuilder) {
    this.medicalForm = fb.group({
      patientId: ['', [Validators.required, Validators.pattern(String.raw`PAT-[0-9]{6}`)]],
      appointmentId: ['', [Validators.required, Validators.pattern(String.raw`APT-[0-9]{6}`)]],
      doctorId: ['', [Validators.required, Validators.pattern(String.raw`EMP-[0-9]{6}`)]],
      complaint: ['', [Validators.required, Validators.pattern(String.raw`^[A-Za-z0-9\-\s,.]+$`)]],
      symptoms: ['', [Validators.required, Validators.pattern(String.raw`^[A-Za-z0-9\-\s,.]+$`)]],
      diagnosis: ['', [Validators.required, Validators.pattern(String.raw`^[A-Za-z0-9\-\s,.]+$`)]],
      medications: this.fb.array([this.createMedRow()]),
      observations: this.fb.array([this.createObsRow()]),
      notes: ['', Validators.pattern(String.raw`^[A-Za-z0-9\-\s,.]+$`)],
      createdBy: [this.employeeId, [Validators.required]],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.fetchMedicalRecordStats();
    this.getDoctors();
    this.getPatients();

    this.editRoute.paramMap.subscribe((params) => {
      this.medicalRecordId = params.get('medRecordId') || '';

      this.isEditable = false;
      this.medicalRecord = null;
      this.resetForm();

      if (this.medicalRecordId) {
        this.isEditable = true;
        this.fetchMedicalRecord(this.medicalRecordId);
      }

      this.fetchMedicalRecordPageDetails();
    });

    // attaching an event listener to appointment form control
    this.medicalForm.get('appointmentId')?.valueChanges.subscribe((value) => {
      if (this.isEditable) return;
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

  resetForm() {
    this.medications.clear();
    this.observations.clear();

    this.medications.push(this.createMedRow());
    this.observations.push(this.createObsRow());
    if (this.isEditable) {
      this.medicalForm.reset({
        createdBy: this.employeeId,
        status: 'Completed',
        doctorId: this.medicalForm.get('doctorId')?.value,
        patientId: this.medicalForm.get('patientId')?.value,
        appointmentId: this.medicalForm.get('appointmentId')?.value,
      });
    } else {
      this.medicalForm.reset({
        createdBy: this.employeeId,
        status: 'Completed',
      });
    }
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
    this.fetchMedicalRecordPageDetails();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
    this.fetchMedicalRecordPageDetails();
  }

  goToPage(index: number) {
    this.page = index;
    this.fetchMedicalRecordPageDetails();
  }

  fetchMedicalRecordPageDetails() {
    const doctorId = this.role === 'Doctor' ? (this.employeeId ?? undefined) : undefined;

    this.medicalRecordService.getMedicalRecords(this.page, this.limit, doctorId).subscribe({
      next: (res) => {
        this.totalPages = res.totalPages;
        this.medicalRecords = res.data;
        this.mapPatientAndDoctors(this.medicalRecords);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error getting medical records');
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
        this.toast.error(error?.error?.message || 'Error getting medical record stats');
      },
    });
  }

  getDoctors() {
    this.medicalForm
      .get('doctorId')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        if (!value?.trim()) return;
        this.userService.getDoctorsBySearch(value).subscribe({
          next: (res) => {
            this.filteredDoctors = res;
            this.getAppointments();
            this.cd.detectChanges();
          },
          error: (err) => {
            this.toast.error(err?.error?.message || 'Error getting doctors');
          },
        });
      });
  }

  getPatients() {
    this.medicalForm
      .get('patientId')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        if (!value) return;
        this.userService.getPatientsBySearch(value).subscribe({
          next: (res) => {
            this.filteredPatients = res;
            this.getAppointments();
            this.cd.detectChanges();
          },
          error: (err) => {
            this.toast.error(err?.error?.message || 'Error getting patients');
          },
        });
      });
  }

  getAppointments() {
    const patientId = this.medicalForm.get('patientId')?.value ?? '';
    const doctorId = this.medicalForm.get('doctorId')?.value ?? '';
    const appointmentId = this.medicalForm.get('appointmentId')?.value ?? '';

    this.appointmentService
      .getAppointmentByDoctorIdOrPatientId(doctorId, patientId, appointmentId)
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

  fetchMedicalRecord(medicalRecordId: string) {
    this.medicalRecordService.getMedicalRecordById(medicalRecordId).subscribe({
      next: (res) => {
        this.medicalRecord = res;
        this.patchForm(res);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error getting medical record');
        this.router.navigate(['/medical-record']);
      },
    });
  }

  patchForm(medicalRecord: MedicalRecordModel) {
    this.medicalForm.patchValue({
      medicalRecordId: medicalRecord.medicalRecordId,
      patientId: medicalRecord.patientId,
      doctorId: medicalRecord.doctorId,
      appointmentId: medicalRecord.appointmentId,
      symptoms: medicalRecord.symptoms,
      diagnosis: medicalRecord.diagnosis,
      notes: medicalRecord.notes,
      complaint: medicalRecord.complaint,
      status: medicalRecord.status,
      createdBy: medicalRecord.createdBy,
    });

    this.setMedications(medicalRecord.medications);
    this.setObservations(medicalRecord.medicalObservations);
  }

  setMedications(meds: any[]) {
    this.medications.clear();
    if (!meds || meds.length == 0) {
      this.medications.push(
        this.fb.group({
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
        }),
      );
    }
    meds.forEach((m) => {
      this.medications.push(
        this.fb.group({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
        }),
      );
    });
  }

  setObservations(obs: any[]) {
    this.observations.clear();
    if (!obs || obs.length == 0) {
      this.observations.push(
        this.fb.group({
          metricName: '',
          metricValue: '',
          recordedTime: '',
        }),
      );
    }
    obs.forEach((o) => {
      this.observations.push(
        this.fb.group({
          metricName: o.metricName,
          metricValue: o.metricValue,
          recordedTime: o.recordedTime ? new Date(o.recordedTime).toISOString().slice(0, 10) : '',
        }),
      );
    });
  }

  // set max limit for recorded time
  maxDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  editProfile(medRecordId: any) {
    setTimeout(() => {
      const formPanel = document.querySelector('.panel-header');
      if (formPanel) {
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      this.router.navigate(['medical-record', medRecordId]);
    }, 200);
  }

  cancelEdit() {
    this.isEditable = false;
    this.router.navigate(['medical-record']);
  }

  validateDraft(): boolean {
    const patientId = this.medicalForm.get('patientId')?.value;
    const doctorId = this.medicalForm.get('doctorId')?.value;
    const appointmentId = this.medicalForm.get('appointmentId')?.value;

    if (!patientId || !doctorId || !appointmentId) {
      return false;
    }

    return true;
  }

  validateCompleted(): boolean {
    const requiredFields = [
      'patientId',
      'doctorId',
      'appointmentId',
      'complaint',
      'symptoms',
      'diagnosis',
      'createdBy',
    ];

    let isValid = true;

    requiredFields.forEach((field) => {
      const control = this.medicalForm.get(field);
      control?.markAsTouched();

      if (!control?.value?.trim()) {
        isValid = false;
      }
    });

    return isValid;
  }

  deleteMedicalRecord(medicalRecordId: string) {
    this.medicalRecordService.deleteMedicalRecord(medicalRecordId).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? 'Medical Record Deleted Sucessfully.');
        this.fetchMedicalRecordPageDetails();
        this.fetchMedicalRecordStats();
        this.cd.detectChanges();
      },
      error: (error) => {
        this.toast.error(error.error.message || 'Unexpected error occured!');
      },
    });
  }

  trackFn(index: number, item: MedicalRecordModel) {
    return item.medicalRecordId;
  }

  // create or update medical record
  onSubmit(recordStatus: string) {
    if (recordStatus == 'Draft') {
      if (!this.validateDraft()) {
        this.toast.error('Patient, Doctor and Appointment are required to save as Draft!');
        this.medicalForm.get('patientId')?.markAsTouched();
        this.medicalForm.get('doctorId')?.markAsTouched();
        this.medicalForm.get('appointmentId')?.markAsTouched();
        return;
      }
    }

    if (recordStatus === 'Completed') {
      if (!this.validateCompleted()) {
        this.toast.error('Please fill all required fields to complete the record!');
        return;
      }
    }

    const payload: any = {
      medicalRecordId: this.isEditable ? this.medicalRecordId : '',
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
    };

    if (this.isEditable) {
      this.isDraftLoading = true;

      payload.updatedBy = this.employeeId;
      payload.updatedAt = new Date();

      this.medicalRecordService.updateMedicalRecord(payload).subscribe({
        next: (res) => {
          this.toast.success(res?.message || 'Medical Record Updated Sucessfully.');
          this.isDraftLoading = false;

          this.fetchMedicalRecordPageDetails();
          this.fetchMedicalRecordStats();

          this.medicalForm.reset({
            createdBy: this.employeeId,
          });

          this.cd.detectChanges();
          this.cancelEdit();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
          this.isDraftLoading = false;
          this.cd.detectChanges();
        },
      });
    } else {
      this.isCreateLoading = true;
      payload.created_at = new Date();

      this.medicalRecordService.createMedicalRecord(payload).subscribe({
        next: (res) => {
          this.toast.success('Medical Record Created Sucessfully.');
          this.isCreateLoading = false;

          this.fetchMedicalRecordPageDetails();
          this.fetchMedicalRecordStats();

          this.medicalForm.reset({ createdBy: this.employeeId });
          this.cd.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
          this.isCreateLoading = false;
        },
      });
    }
    setTimeout(() => {
      const formPanel = document.querySelector('.table-wrapper');
      if (formPanel) {
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }
}
