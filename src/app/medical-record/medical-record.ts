import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PermissionService } from '../services/permission';
import { PERMISSIONS } from '../constants/permissions';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, Pagination],
  templateUrl: './medical-record.html',
  styleUrl: './medical-record.css',
})
export class MedicalRecord implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  records: any[] = [];
  totalRecords = 0;
  draftCount = 0;
  finalCount = 0;
  loading = true;

  /* PAGINATION */
  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;
  hasPrevPage = false;

  /* DROPDOWN SOURCES */
  patients: any[] = [];
  doctors: any[] = [];
  appointments: any[] = [];
  filteredAppointments: any[] = [];

  /* FILTERS */
  filterPatientId = '';
  filterStatus = '';

  isEditMode = false;
  selectedRecordMongoId = '';
  selectedRecordCode = '';

  showModal = false;
  errorMessage = '';
  successMessage = '';

  currentUser: any = null;

  recordForm: any = {
    patientId: '',
    doctorEmployeeId: '',
    appointmentId: '',
    diagnosis: '',
    complaint: '',
    symptoms: '',
    notes: '',
    status: 'DRAFT',
    medications: [] as any[],
    medicalObservations: [] as any[],
  };

  constructor(
    readonly auth: Auth,
    readonly cd: ChangeDetectorRef,
    readonly permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    if (!globalThis.window || !localStorage.getItem('token')) {
      return;
    }

    this.auth.getCurrentUser().subscribe({
      next: (response: any) => {
        this.currentUser = response.data;
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });

    this.loadDropdownSources();
    this.loadRecords();
  }

  loadDropdownSources() {
    this.auth.getAllPatients({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.patients = res.data || [];
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });

    this.auth.getDoctors({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.doctors = res.data || [];
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });

    this.auth.getAllAppointments({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.appointments = res.data || [];
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });
  }

  /* LOAD RECORDS — paginated, 10 per page */
  loadRecords() {
    this.loading = true;

    this.auth.getMedicalRecords({
      page: this.currentPage,
      limit: 5,
      patientId: this.filterPatientId || undefined,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (response: any) => {
        this.records = response.data || [];
        this.totalRecords = response.meta?.totalCount ?? this.records.length;
        this.totalPages = response.meta?.totalPages || 1;
        this.hasNextPage = response.meta?.hasNextPage || false;
        this.hasPrevPage = response.meta?.hasPrevPage || false;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cd.detectChanges();
      },
    });

    this.loadStatusCounts();
  }


  loadStatusCounts() {
    this.auth.getMedicalRecords({
      limit: 1,
      patientId: this.filterPatientId || undefined,
      status: 'DRAFT',
    }).subscribe({
      next: (res: any) => {
        this.draftCount = res.meta?.totalCount ?? 0;
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });

    this.auth.getMedicalRecords({
      limit: 1,
      patientId: this.filterPatientId || undefined,
      status: 'FINAL',
    }).subscribe({
      next: (res: any) => {
        this.finalCount = res.meta?.totalCount ?? 0;
        this.cd.detectChanges();
      },
      error: (err: any) => console.log(err),
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadRecords();
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    /* Ignore clicks while a page request is in flight (dup-request + race guard). */
    if (this.loading) return;
    this.currentPage = page;
    this.loadRecords();
  }

  
  onPatientOrDoctorChange() {
    const { patientId, doctorEmployeeId } = this.recordForm;

    if (!patientId && !doctorEmployeeId) {
      this.filteredAppointments = [];
    } else {
      this.filteredAppointments = this.appointments.filter((a: any) =>
        (!patientId || a.patientId === patientId) &&
        (!doctorEmployeeId || a.doctorEmployeeId === doctorEmployeeId)
      );
    }

    const stillValid = this.filteredAppointments.some(
      (a: any) => a.appointmentId === this.recordForm.appointmentId,
    );
    if (!stillValid) {
      this.recordForm.appointmentId = '';
    }
  }

  /* MEDICATION ROWS */
  addMedicationRow() {
    this.recordForm.medications.push({ name: '', dosage: '', frequency: '', duration: '', deliveryMethod: '' });
  }

  removeMedicationRow(index: number) {
    this.recordForm.medications.splice(index, 1);
  }

  /* OBSERVATION ROWS */
  addObservationRow() {
    this.recordForm.medicalObservations.push({ metricName: '', metricValue: '' });
  }

  removeObservationRow(index: number) {
    this.recordForm.medicalObservations.splice(index, 1);
  }

  openModal() {
    this.isEditMode = false;
    this.selectedRecordMongoId = '';
    this.selectedRecordCode = '';
    this.resetForm();

    
    if (this.currentUser?.role === 'doctor') {
      this.recordForm.doctorEmployeeId = this.currentUser.id;
      this.onPatientOrDoctorChange();
    }

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetForm() {
    this.recordForm = {
      patientId: '',
      doctorEmployeeId: '',
      appointmentId: '',
      diagnosis: '',
      complaint: '',
      symptoms: '',
      notes: '',
      status: 'DRAFT',
      medications: [],
      medicalObservations: [],
    };
    this.filteredAppointments = [];
  }

  submitRecord(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    if (this.isEditMode) {
      this.auth.updateMedicalRecord(this.selectedRecordMongoId, this.recordForm).subscribe({
        next: (response: any) => {
          this.successMessage = response.message;
          this.loadRecords();
          setTimeout(() => this.closeModal(), 1000);
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Unable To Update Medical Record';
        },
      });
      return;
    }

    this.auth.createMedicalRecord(this.recordForm).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.loadRecords();
        setTimeout(() => this.closeModal(), 1000);
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Create Medical Record';
      },
    });
  }

  editRecord(record: any) {
    if (!this.canEditRecord(record)) {
      return;
    }

    this.isEditMode = true;
    this.selectedRecordMongoId = record._id;
    this.selectedRecordCode = record.recordCode;
    this.recordForm = {
      patientId: record.patientId,
      doctorEmployeeId: record.doctorEmployeeId,
      appointmentId: record.appointmentId,
      diagnosis: record.diagnosis || '',
      complaint: record.complaint || '',
      symptoms: record.symptoms || '',
      notes: record.notes || '',
      status: record.status,
      medications: (record.medications || []).map((m: any) => ({ ...m })),
      medicalObservations: (record.medicalObservations || []).map((o: any) => ({ ...o })),
    };
    this.onPatientOrDoctorChange();
    this.showModal = true;
  }

  deleteRecord(record: any) {
    if (!confirm(`Soft-delete record ${record.recordCode}? This sets status to DELETED and excludes it from future lists.`)) {
      return;
    }

    this.auth.deleteMedicalRecord(record._id).subscribe({
      next: () => this.loadRecords(),
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Delete Medical Record';
        this.cd.detectChanges();
      },
    });
  }


  canEditRecord(record: any): boolean {
    if (!this.permissionService.has(PERMISSIONS.EDIT_MEDICAL_RECORD)) {
      return false;
    }

    if (record.status === 'FINAL' && !this.permissionService.has(PERMISSIONS.UPDATE_FINALIZED_MEDICAL_RECORD)) {
      return false;
    }

    if (this.currentUser?.role === 'doctor') {
      return record.doctorEmployeeId === this.currentUser?.id;
    }
    return true;
  }


  patientLabel(patientId: string): string {
    const p = this.patients.find((x: any) => x.UHID === patientId);
    return p ? `${p.name} (${p.UHID})` : patientId;
  }

  doctorLabel(employeeId: string): string {
    const d = this.doctors.find((x: any) => x.employeeId === employeeId);
    return d ? d.name : employeeId;
  }
}
