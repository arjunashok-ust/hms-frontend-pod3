/**
 * @file medical-record.ts
 * @description
 * This file defines the component for managing patient medical records (encounters).
 *
 * @overview
 * This is a feature-rich component for creating, viewing, updating, and deleting medical records.
 * It includes a complex reactive form with nested form arrays for medications and observations.
 * It manages role-based permissions for viewing and editing records and fetches all necessary data (patients, doctors, appointments) via multiple services.
 *
 * Connections:
 *   User Interaction -> MEDICAL-RECORD.TS -> [RecordsService, ApiService, AppointmentService] -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ApiService } from '../../services/apiService/api-service';
import { AppointmentService } from '../../services/appointmentService/appointment-service';
import { RecordsService } from '../../services/recordsService/record-service';
import { RecordDetailsModalComponent } from '../record-modal/record-modal';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective, RecordDetailsModalComponent],
  templateUrl: './medical-record.html',
  styleUrls: ['./medical-record.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalRecordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly recordsService = inject(RecordsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);

  private readonly platformId = inject(PLATFORM_ID);

  recordForm!: FormGroup;
  currentUser: any = null;
  userPermissions: string[] = [];

  records: any[] = [];
  patients: any[] = [];
  doctors: any[] = [];
  appointments: any[] = [];

  isLoading = true;
  isSubmitting = false;
  isEditMode = false;
  editingRecordId: string | null = null;
  stats = { total: 0, active: 0, review: 0 };
  pendingAppointmentId: string | null = null;


  currentPage = 1;
  pageSize = environment.pageSize;
  totalRecords = 0;
  totalPages = 1;
  visiblePages: (number | string)[] = [];

  isFormPatientOpen = false; displayFormPatients: any[] = []; selectedFormPatient = '';
  isFilterPatientOpen = false; displayFilterPatients: any[] = []; selectedFilterPatient = ''; filterPatientId = '';

  isFormDoctorOpen = false; displayFormDoctors: any[] = []; selectedFormDoctor = '';
  isFilterDoctorOpen = false; displayFilterDoctors: any[] = []; selectedFilterDoctor = ''; filterDoctorId = '';

  isFormAppointmentOpen = false; displayFormAppointments: any[] = []; selectedFormAppointment = '';
  filterDate = '';

  showViewModal = false;
  selectedRecordForView: any = null;

  viewRecord(record: any) {
    this.selectedRecordForView = record;
    this.showViewModal = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // 1. If the click happened completely outside any dropdown, close all of them.
    if (!target.closest('.searchable-dropdown-container')) {
      this.isFormAppointmentOpen = false;
      this.isFormPatientOpen = false;
      this.isFilterPatientOpen = false;
      this.isFormDoctorOpen = false;
      this.isFilterDoctorOpen = false;
      this.cdr.markForCheck();
      return;
    }

    // 2. If the click happened INSIDE a dropdown container, close the others.
    const clickedContainer = target.closest('.searchable-dropdown-container');
    const clickedInput = clickedContainer?.querySelector('input');
    const label = clickedInput?.getAttribute('aria-label');
    const isFilterGroup = target.closest('.filter-group');

    if (label !== 'appointmentInput') this.isFormAppointmentOpen = false;

    if (label === 'patientInput') {
      if (isFilterGroup) this.isFormPatientOpen = false;
      else this.isFilterPatientOpen = false;
    } else {
      this.isFormPatientOpen = false;
      this.isFilterPatientOpen = false;
    }
    if (label === 'doctorInput') {
      this.isFilterDoctorOpen = false;
    } else if (label === 'doctorControl') {
      this.isFormDoctorOpen = false;
    } else {
      this.isFormDoctorOpen = false;
      this.isFilterDoctorOpen = false;
    }

    this.cdr.markForCheck();
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedRecordForView = null;
  }

  ngOnInit() {
    this.initForm();

    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        if (params['appointmentId']) {
          this.pendingAppointmentId = params['appointmentId'];
        }
      });
      this.fetchCurrentUserAndData();
    } else {

      this.isLoading = false;
    }
  }

  initForm() {
    this.recordForm = this.fb.group({
      patientId: ['', Validators.required], appointmentId: ['', Validators.required], doctorEmployeeId: ['', Validators.required],
      complaint: [''], symptoms: [''], diagnosis: [''], notes: [''],
      medications: this.fb.array([]), medicalObservations: this.fb.array([])
    });

    this.addMedication();
    this.addObservation();
  }

  get medications() { return this.recordForm.get('medications') as FormArray; }
  get medicalObservations() { return this.recordForm.get('medicalObservations') as FormArray; }

  addMedication() { this.medications.push(this.fb.group({ name: ['', Validators.required], dosage: [''], frequency: [''], duration: [''] })); }
  removeMedication(i: number) { this.medications.removeAt(i); }

  addObservation() { this.medicalObservations.push(this.fb.group({ metricName: ['', Validators.required], metricValue: ['', Validators.required], recordedTime: [new Date().toISOString().slice(0, 16)] })); }
  removeObservation(i: number) { this.medicalObservations.removeAt(i); }

  fetchCurrentUserAndData() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.apiService.getCurrentUser().subscribe({
      next: (res: any) => {
        this.currentUser = res.user?.profile || res.user || res;
        this.userPermissions = this.getTokenPayload().permissions || [];

        forkJoin({
          patients: this.apiService.getAllPatients().pipe(catchError(() => of([]))),

          doctorsList: this.appointmentService.getDoctors().pipe(catchError(() => of([]))),
          appointments: this.appointmentService.getAllAppointments().pipe(catchError(() => of([])))
        }).subscribe(({ patients, doctorsList, appointments }) => {


          const extract = (d: any) => Array.isArray(d) ? d : (d?.data || []);

          this.patients = extract(patients).filter((p: any) => p.status?.toUpperCase() === 'ACTIVE' || p.status === 'true');
          this.doctors = extract(doctorsList);
          this.appointments = extract(appointments);

          this.displayFormPatients = [...this.patients];
          this.displayFilterPatients = [...this.patients];
          this.displayFormDoctors = [...this.doctors];
          this.displayFilterDoctors = [...this.doctors];
          this.displayFormAppointments = [...this.appointments];

          if (this.hasPermission('CREATE_MY_RECORD') && !this.hasPermission('CREATE_RECORD_FOR_ANYONE')) {
            this.recordForm.patchValue({ doctorEmployeeId: this.currentUser.employeeCode });
            this.selectedFormDoctor = `${this.currentUser.name} (${this.currentUser.employeeCode})`;
            this.selectedFilterDoctor = `${this.currentUser.name} (${this.currentUser.employeeCode})`;
            this.filterDoctorId = this.currentUser.employeeCode;
          }

          if (this.pendingAppointmentId) {
            const apt = this.appointments.find(a => a.appointmentCode === this.pendingAppointmentId);
            if (apt) this.selectAppointment(apt);
          }
          this.applyFilters();
        });
      },
      error: (err) => {
        console.error("Failed to fetch user data on refresh", err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openFormDoctorDropdown() {
    if (this.hasPermission('CREATE_RECORD_FOR_ANYONE')) {
      this.isFormDoctorOpen = true;
      this.displayFormDoctors = this.doctors;
    }
  }

  openFilterDoctorDropdown() {
    if (this.hasPermission('VIEW_ALL_RECORDS')) {
      this.isFilterDoctorOpen = true;
      this.displayFilterDoctors = this.doctors;
    }
  }

  onAppointmentInput(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.isFormAppointmentOpen = true;
    this.selectedFormAppointment = (event.target as HTMLInputElement).value;
    this.displayFormAppointments = this.appointments.filter(apt => (apt.appointmentCode || '').toLowerCase().includes(term));
    this.cdr.markForCheck();
  }

  selectAppointment(apt: any) {
    this.recordForm.patchValue({ appointmentId: apt.appointmentCode });
    this.selectedFormAppointment = apt.appointmentCode;
    this.isFormAppointmentOpen = false;

    if (apt.patientId) {
      const pat = this.patients.find(p => p.UHID === apt.patientId);
      if (pat) this.selectPatient(pat, 'form');
    }
    if (apt.doctorEmployeeID && this.hasPermission('CREATE_RECORD_FOR_ANYONE')) {
      const doc = this.doctors.find(d => d.employeeCode === apt.doctorEmployeeID);
      if (doc) this.selectDoctor(doc, 'form');
    }
    this.cdr.markForCheck();
  }

  onPatientInput(event: Event, source: 'form' | 'filter') {
    const val = (event.target as HTMLInputElement).value;
    const term = val.toLowerCase();

    if (source === 'form') {
      this.isFormPatientOpen = true;
      this.selectedFormPatient = val;
      this.displayFormPatients = this.patients.filter(p => (p.name || '').toLowerCase().includes(term) || (p.UHID || '').toLowerCase().includes(term));
    } else {
      this.isFilterPatientOpen = true;
      this.selectedFilterPatient = val;
      if (!val) { this.filterPatientId = ''; this.applyFilters(); }
      this.displayFilterPatients = this.patients.filter(p => (p.name || '').toLowerCase().includes(term) || (p.UHID || '').toLowerCase().includes(term));
    }
    this.cdr.markForCheck();
  }

  onDoctorInput(event: Event, source: 'form' | 'filter') {
    const val = (event.target as HTMLInputElement).value;
    const term = val.toLowerCase();

    if (source === 'form') {
      this.isFormDoctorOpen = true;
      this.selectedFormDoctor = val;
      this.displayFormDoctors = this.doctors.filter(d => (d.name || '').toLowerCase().includes(term) || (d.employeeCode || '').toLowerCase().includes(term));
    } else {
      this.isFilterDoctorOpen = true;
      this.selectedFilterDoctor = val;
      if (!val) { this.filterDoctorId = ''; this.applyFilters(); }
      this.displayFilterDoctors = this.doctors.filter(d => (d.name || '').toLowerCase().includes(term) || (d.employeeCode || '').toLowerCase().includes(term));
    }
    this.cdr.markForCheck();
  }

  selectPatient(pat: any, source: 'form' | 'filter') {
    if (source === 'form') {
      this.recordForm.patchValue({ patientId: pat.UHID });
      this.selectedFormPatient = `${pat.name} (${pat.UHID})`;
      this.isFormPatientOpen = false;
    } else {
      this.filterPatientId = pat.UHID;
      this.selectedFilterPatient = `${pat.name} (${pat.UHID})`;
      this.isFilterPatientOpen = false;
      this.applyFilters();
    }
    this.cdr.markForCheck();
  }

  selectDoctor(doc: any, source: 'form' | 'filter') {
    if (source === 'form') {
      this.recordForm.patchValue({ doctorEmployeeId: doc.employeeCode });
      this.selectedFormDoctor = `${doc.name} (${doc.employeeCode})`;
      this.isFormDoctorOpen = false;
    } else {
      this.filterDoctorId = doc.employeeCode;
      this.selectedFilterDoctor = `${doc.name} (${doc.employeeCode})`;
      this.isFilterDoctorOpen = false;
      this.applyFilters();
    }
    this.cdr.markForCheck();
  }

  onFilterDateChange(event: Event) {
    this.filterDate = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  closeDropdowns(key: 'formPatient' | 'filterPatient' | 'formDoctor' | 'filterDoctor' | 'formAppointment') {
    setTimeout(() => {
      if (key === 'formPatient') this.isFormPatientOpen = false;
      if (key === 'filterPatient') this.isFilterPatientOpen = false;
      if (key === 'formDoctor') this.isFormDoctorOpen = false;
      if (key === 'filterDoctor') this.isFilterDoctorOpen = false;
      if (key === 'formAppointment') this.isFormAppointmentOpen = false;
      this.cdr.markForCheck();
    }, 150);
  }




  applyFilters() {
    this.currentPage = 1;
    this.reloadRecordsData();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.reloadRecordsData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.reloadRecordsData();
    }
  }

  reloadRecordsData() {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.filterPatientId) params.patientId = this.filterPatientId;
    if (this.filterDoctorId) params.doctorId = this.filterDoctorId;
    if (this.filterDate) params.date = this.filterDate;

    const recordsCall = this.hasPermission('VIEW_ALL_RECORDS')
      ? this.recordsService.getAllMedicalRecords(params)
      : this.recordsService.getMyMedicalRecords(params);

    recordsCall.subscribe({
      next: (res: any) => {
        this.records = res.data || [];
        this.totalRecords = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;

        this.generatePagesArray();

        this.stats.total = this.totalRecords;
        this.stats.active = this.records.filter(r => r.status === 'FINAL').length;
        this.stats.review = this.records.filter(r => r.status === 'DRAFT').length;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error("Failed to load records");
        this.cdr.markForCheck();
      }
    });
  }

  hasPermission(permission: string): boolean { return this.userPermissions.includes(permission); }

  canEdit(record: any): boolean {
    const isMyRecord = record.doctorEmployeeId === this.currentUser?.employeeCode;
    if (this.hasPermission('UPDATE_FINALISED_RECORD')) return true;
    if (record.status === 'DRAFT') {
      if (this.hasPermission('UPDATE_RECORD')) return true;
      if (this.hasPermission('UPDATE_MY_RECORD') && isMyRecord) return true;
    }
    return false;
  }

  onSubmit(status: 'DRAFT' | 'FINAL') {

    if (this.medications.length === 1 && !this.medications.at(0).get('name')?.value) {
      this.removeMedication(0);
    }
    if (this.medicalObservations.length === 1 && !this.medicalObservations.at(0).get('metricName')?.value) {
      this.removeObservation(0);
    }

    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      this.toast.error('Fill required fields');


      if (this.medications.length === 0) this.addMedication();
      if (this.medicalObservations.length === 0) this.addObservation();

      return;
    }

    this.isSubmitting = true;
    const payload = { ...this.recordForm.getRawValue(), status: status };

    const req = (this.isEditMode && this.editingRecordId)
      ? this.recordsService.updateMedicalRecord(this.editingRecordId, payload)
      : this.recordsService.createMedicalRecord(payload);

    req.subscribe({
      next: () => {
        this.toast.success(`Saved as ${status}`);
        this.resetForm();
        this.reloadRecordsData();
      },
      error: (err: any) => { this.isSubmitting = false; this.toast.error(err.error?.message || 'Error occurred'); }
    });
  }

  editRecord(record: any) {
    this.isEditMode = true; this.editingRecordId = record._id || record.recordCode;
    while (this.medications.length !== 0) { this.medications.removeAt(0); }
    while (this.medicalObservations.length !== 0) { this.medicalObservations.removeAt(0); }

    record.medications?.forEach((med: any) => this.medications.push(this.fb.group({ name: [med.name, Validators.required], dosage: [med.dosage], frequency: [med.frequency], duration: [med.duration] })));
    record.medicalObservations?.forEach((obs: any) => this.medicalObservations.push(this.fb.group({ metricName: [obs.metricName, Validators.required], metricValue: [obs.metricValue, Validators.required], recordedTime: [obs.recordedTime ? new Date(obs.recordedTime).toISOString().slice(0, 16) : ''] })));

    this.recordForm.patchValue({ patientId: record.patientId, appointmentId: record.appointmentId, doctorEmployeeId: record.doctorEmployeeId, complaint: record.complaint, symptoms: record.symptoms, diagnosis: record.diagnosis, notes: record.notes });

    this.selectedFormAppointment = record.appointmentId;
    const pat = this.patients.find(p => p.UHID === record.patientId);
    this.selectedFormPatient = pat ? `${pat.name} (${pat.UHID})` : record.patientId;
    const doc = this.doctors.find(d => d.employeeCode === record.doctorEmployeeId);
    this.selectedFormDoctor = doc ? `${doc.name} (${doc.employeeCode})` : record.doctorEmployeeId;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteRecord(id: any) {
    if (confirm('Delete this record?')) {
      this.recordsService.deleteMedicalRecord(id).subscribe({
        next: () => {
          this.toast.success('Deleted');
          this.reloadRecordsData();
        }
      });
    }
  }

  resetForm() {
    this.isEditMode = false; this.editingRecordId = null; this.recordForm.reset();
    this.selectedFormPatient = ''; this.selectedFormAppointment = ''; this.selectedFormDoctor = '';
    this.isSubmitting = false;

    while (this.medications.length !== 0) { this.medications.removeAt(0); }
    while (this.medicalObservations.length !== 0) { this.medicalObservations.removeAt(0); }

    if (this.hasPermission('CREATE_MY_RECORD') && !this.hasPermission('CREATE_RECORD_FOR_ANYONE')) {
      this.recordForm.patchValue({ doctorEmployeeId: this.currentUser.employeeCode });
      this.selectedFormDoctor = `${this.currentUser.name} (${this.currentUser.employeeCode})`;
    }
  }

  getInitials(name: string | undefined): string { return name ? name.substring(0, 2).toUpperCase() : 'MR'; }

  private getTokenPayload(): any {

    if (!isPlatformBrowser(this.platformId)) return {};

    const token = localStorage.getItem('token');
    if (!token) return {};
    try { return JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))); } catch { return {}; }
  }

  generatePagesArray() {
    const total = this.totalPages;
    const currentShowingPage = this.currentPage;

    if (total <= 6) {
      this.visiblePages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    if (currentShowingPage <= 3) {
      this.visiblePages = [1, 2, 3, 4, '...', total];
    } else if (currentShowingPage >= total - 2) {
      this.visiblePages = [1, '...', total - 3, total - 2, total - 1, total];
    } else {
      this.visiblePages = [1, '...', currentShowingPage - 1, currentShowingPage, currentShowingPage + 1, '...', total];
    }
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.currentPage = page;
      this.reloadRecordsData();
    }
  }
}