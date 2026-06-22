import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PermissionService } from '../services/permission';
import { PERMISSIONS } from '../constants/permissions';
import { PaginationControls } from '../shared/pagination-controls/pagination-controls';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, PaginationControls],
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

  /* DROPDOWN SOURCES — limit:100 so the default limit:10 pagination doesn't truncate the list */
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
      limit: 10,
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

  /* DRAFT/FINAL COUNTS — must reflect the whole filtered dataset, not just the
     current page, so these are separate count-only queries (limit:1 keeps the
     payload tiny; totalCount comes from countDocuments(), unaffected by limit). */
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
    this.currentPage = page;
    this.loadRecords();
  }

  /* APPOINTMENT DROPDOWN MUST ONLY OFFER APPOINTMENTS THAT ACTUALLY BELONG
     TO THE CURRENTLY SELECTED PATIENT + DOCTOR — otherwise a record could be
     saved pointing at someone else's appointment. */
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

    /* DOCTORS CREATE RECORDS UNDER THEIR OWN NAME — no point asking them to pick themselves */
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

  /* DOCTORS HOLD EDIT_MEDICAL_RECORD BUT CAN ONLY EDIT THEIR OWN RECORDS (server-enforced) —
     row-level check, can't be a static *hasPermission. */
  canEditRecord(record: any): boolean {
    if (!this.permissionService.has(PERMISSIONS.EDIT_MEDICAL_RECORD)) {
      return false;
    }

    /* FINAL records additionally require UPDATE_FINALIZED_MEDICAL_RECORD —
       currently only super_admin and admin hold it, so doctors never edit a FINAL record. */
    if (record.status === 'FINAL' && !this.permissionService.has(PERMISSIONS.UPDATE_FINALIZED_MEDICAL_RECORD)) {
      return false;
    }

    if (this.currentUser?.role === 'doctor') {
      return record.doctorEmployeeId === this.currentUser?.id;
    }
    return true;
  }

  /* DISPLAY HELPERS — IDs aren't human-readable on their own */
  patientLabel(patientId: string): string {
    const p = this.patients.find((x: any) => x.UHID === patientId);
    return p ? `${p.name} (${p.UHID})` : patientId;
  }

  doctorLabel(employeeId: string): string {
    const d = this.doctors.find((x: any) => x.employeeId === employeeId);
    return d ? d.name : employeeId;
  }
}
