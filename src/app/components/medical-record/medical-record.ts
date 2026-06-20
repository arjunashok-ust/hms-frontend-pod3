import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ApiService } from '../../services/apiService/api-service';
import { AppointmentService } from '../../services/appointmentService/appointment-service';
import { RecordsService } from '../../services/recordsService/record-service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './medical-record.html',
  styleUrls: ['./medical-record.css']
})
export class MedicalRecordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly recordsService = inject(RecordsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);

  recordForm!: FormGroup;
  currentUser: any = null;
  userPermissions: string[] = [];

  records: any[] = [];
  filteredRecords: any[] = [];
  patients: any[] = [];
  doctors: any[] = [];
  appointments: any[] = [];

  isLoading = true;
  isSubmitting = false;
  isEditMode = false;
  editingRecordId: string | null = null;
  stats = { total: 0, active: 0, review: 0 };
  pendingAppointmentId: string | null = null;

  // --- Dropdown States & Displays ---
  isFormPatientOpen = false; displayFormPatients: any[] = []; selectedFormPatient = '';
  isFilterPatientOpen = false; displayFilterPatients: any[] = []; selectedFilterPatient = ''; filterPatientId = '';

  isFormDoctorOpen = false; displayFormDoctors: any[] = []; selectedFormDoctor = '';
  isFilterDoctorOpen = false; displayFilterDoctors: any[] = []; selectedFilterDoctor = ''; filterDoctorId = '';

  isFormAppointmentOpen = false; displayFormAppointments: any[] = []; selectedFormAppointment = '';
  filterDate = '';

  ngOnInit() {
    this.initForm();

    // Check if redirected from Appointments page
    this.route.queryParams.subscribe(params => {
      if (params['appointmentId']) {
        this.pendingAppointmentId = params['appointmentId'];
      }
    });

    this.fetchCurrentUserAndData();
  }

  initForm() {
    this.recordForm = this.fb.group({
      patientId: ['', Validators.required], appointmentId: ['', Validators.required], doctorEmployeeId: ['', Validators.required],
      complaint: [''], symptoms: [''], diagnosis: [''], notes: [''],
      medications: this.fb.array([]), medicalObservations: this.fb.array([])
    });
  }

  get medications() { return this.recordForm.get('medications') as FormArray; }
  get medicalObservations() { return this.recordForm.get('medicalObservations') as FormArray; }

  addMedication() { this.medications.push(this.fb.group({ name: ['', Validators.required], dosage: [''], frequency: [''], duration: [''] })); }
  removeMedication(i: number) { this.medications.removeAt(i); }

  addObservation() { this.medicalObservations.push(this.fb.group({ metricName: ['', Validators.required], metricValue: ['', Validators.required], recordedTime: [new Date().toISOString().slice(0, 16)] })); }
  removeObservation(i: number) { this.medicalObservations.removeAt(i); }

  fetchCurrentUserAndData() {
    this.apiService.getCurrentUser().subscribe({
      next: (res: any) => {
        this.currentUser = res.user?.profile || res.user || res;
        this.userPermissions = this.getTokenPayload().permissions || [];

        const recordsCall = this.hasPermission('VIEW_ALL_RECORDS')
          ? this.recordsService.getAllMedicalRecords()
          : this.recordsService.getMyMedicalRecords();

        forkJoin({
          patients: this.apiService.getAllPatients().pipe(catchError(() => of([]))),
          employees: this.apiService.getAllEmployees().pipe(catchError(() => of([]))),
          appointments: this.appointmentService.getAllAppointments().pipe(catchError(() => of([]))),
          records: recordsCall.pipe(catchError(() => of([])))
        }).subscribe(({ patients, employees, appointments, records }) => {

          const extract = (d: any) => Array.isArray(d) ? d : (d?.data || []);

          this.patients = extract(patients).filter((p: any) => p.status?.toUpperCase() === 'ACTIVE' || p.status === 'true');
          this.doctors = extract(employees).filter((e: any) => e.role?.toUpperCase() === 'DOCTOR');
          this.appointments = extract(appointments);
          this.records = extract(records);

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

          // Pre-fill if redirected from another page
          if (this.pendingAppointmentId) {
            const apt = this.appointments.find(a => a.appointmentCode === this.pendingAppointmentId);
            if (apt) this.selectAppointment(apt);
          }

          this.applyFilters();
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  // ==========================================
  // SAFE DROPDOWN TOGGLES
  // ==========================================
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

  // ==========================================
  // FORM DROPDOWN HANDLERS
  // ==========================================
  onAppointmentInput(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.isFormAppointmentOpen = true;
    this.selectedFormAppointment = (event.target as HTMLInputElement).value;
    this.displayFormAppointments = this.appointments.filter(apt => (apt.appointmentCode || '').toLowerCase().includes(term));
    this.cdr.detectChanges();
  }

  selectAppointment(apt: any) {
    this.recordForm.patchValue({ appointmentId: apt.appointmentCode });
    this.selectedFormAppointment = apt.appointmentCode;
    this.isFormAppointmentOpen = false;

    if (apt.patientID) {
      const pat = this.patients.find(p => p.UHID === apt.patientID);
      if (pat) this.selectPatient(pat, 'form');
    }
    if (apt.doctorEmployeeID && this.hasPermission('CREATE_RECORD_FOR_ANYONE')) {
      const doc = this.doctors.find(d => d.employeeCode === apt.doctorEmployeeID);
      if (doc) this.selectDoctor(doc, 'form');
    }
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
      this.cdr.detectChanges();
    }, 150);
  }

  applyFilters() {
    this.filteredRecords = this.records.filter(rec => {
      const matchPat = !this.filterPatientId || rec.patientId === this.filterPatientId;
      const matchDoc = !this.filterDoctorId || rec.doctorEmployeeId === this.filterDoctorId;
      const matchDate = !this.filterDate || new Date(rec.visitDate).toISOString().split('T')[0] === this.filterDate;
      return matchPat && matchDoc && matchDate;
    });

    this.stats.total = this.filteredRecords.length;
    this.stats.active = this.filteredRecords.filter(r => r.status === 'FINAL').length;
    this.stats.review = this.filteredRecords.filter(r => r.status === 'DRAFT').length;
    this.cdr.detectChanges();
  }

  // ==========================================
  // SUBMISSIONS AND ACTIONS
  // ==========================================
  hasPermission(permission: string): boolean { return this.userPermissions.includes(permission); }

  canEdit(record: any): boolean {
    const isMyRecord = record.doctorEmployeeId === this.currentUser?.employeeCode;
    if (this.hasPermission('UPDATE_FINALISED_RECORD')) return true;
    if (this.hasPermission('UPDATE_RECORDS') && record.status === 'DRAFT') return true;
    if (this.hasPermission('UPDATE_MY_RECORDS') && isMyRecord && record.status === 'DRAFT') return true;
    return false;
  }

  onSubmit(status: 'DRAFT' | 'FINAL') {
    if (this.recordForm.invalid) { this.recordForm.markAllAsTouched(); this.toast.error('Fill required fields'); return; }
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

  reloadRecordsData() {
    const recordsCall = this.hasPermission('VIEW_ALL_RECORDS')
      ? this.recordsService.getAllMedicalRecords()
      : this.recordsService.getMyMedicalRecords();

    recordsCall.subscribe(recs => {
      this.records = (recs as any)?.data || recs || [];
      this.applyFilters();
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

  deleteRecord(id: string) {
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

  getInitials(name: string): string { return name ? name.substring(0, 2).toUpperCase() : 'MR'; }
  private getTokenPayload(): any {
    const token = localStorage.getItem('token');
    if (!token) return {};
    try { return JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))); } catch { return {}; }
  }
}