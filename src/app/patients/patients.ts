import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { NotificationService } from '../services/notification';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, Pagination],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Patients implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  patients: any[] = [];
  totalPatients = 0;
  loading = true;

  /* PAGINATION */
  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;
  hasPrevPage = false;

  /* STATS */
  activePatients = 0;
  inactivePatients = 0;

  isEditMode = false;
  selectedPatientUHID = '';

  //Max Date
  maxDate = new Date().toISOString().split('T')[0];
  formData: any = {
    email: '',
    name: '',
    phone: '',
    gender: 'Male',
    date_of_birth: '',
    emergencyContact: '',
    status: true,
    address: {
      line1: '',
      city: '',
      postcode: '',
    },
  };

  constructor(
    readonly auth: Auth,
    readonly cdr: ChangeDetectorRef,
    readonly notify: NotificationService,
  ) {}

  ngOnInit(): void {
    if (globalThis.window) {
      const token = localStorage.getItem('token');

      if (token) {
        this.loadPatients();
        this.loadPatientStats();
      } else {
        this.notify.error('No token found');
      }
    }
  }

  loadPatientStats() {
    this.auth.getPatientUI().subscribe({
      next: (response: any) => {
        this.activePatients = response.data.activePatients || 0;
        this.inactivePatients = response.data.inactivePatients || 0;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }

  loadPatients() {
    this.loading = true;
    this.auth.getAllPatients({ page: this.currentPage, limit: 5 }).subscribe({
      next: (response: any) => {
        this.patients = response.data || [];
        this.totalPatients = response.meta?.totalCount || 0;
        this.totalPages = response.meta?.totalPages || 1;
        this.hasNextPage = response.meta?.hasNextPage || false;
        this.hasPrevPage = response.meta?.hasPrevPage || false;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    /* Ignore page clicks while a request is in flight — prevents duplicate
       requests and the out-of-order race where a slow earlier page overwrites
       a faster later one. */
    if (this.loading) return;
    this.currentPage = page;
    this.loadPatients();
  }

  createPatient(form: any) {
    if (form.invalid) {
      /* Fields pre-filled by editPatient() are never "touched" by the user,
         so their inline error stays hidden even though they're blocking
         submission. Marking everything touched here surfaces exactly which
         field is wrong. */
      form.form.markAllAsTouched();
      this.notify.error('Please fill all required fields');
      return;
    }

    if (this.isEditMode) {
      this.auth.updatePatient(this.selectedPatientUHID, this.formData).subscribe({
        next: (response: any) => {
          this.notify.success(response.message || 'Patient updated successfully');
          this.loadPatients();
          this.loadPatientStats();
          this.cancelEdit();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.notify.error(err?.error?.message || 'Unable To Update Patient');
          this.cdr.markForCheck();
        },
      });
      return;
    }

    this.auth.createPatient(this.formData).subscribe({
      next: (response: any) => {
        this.notify.success(response.message || 'Patient created successfully');
        this.loadPatients();
        this.loadPatientStats();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || 'Unable To Create Patient');
        this.cdr.markForCheck();
      },
    });
  }

  editPatient(patient: any) {
    this.isEditMode = true;
    this.selectedPatientUHID = patient.UHID;

    this.formData = {
      email: patient.email || '',
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      emergencyContact: patient.emergencyContact,
      status: patient.status,
      address: {
        line1: patient.address?.line1 || '',
        city: patient.address?.city || '',
        postcode: patient.address?.postcode || '',
      },
    };
  }

  cancelEdit() {
    this.isEditMode = false;
    this.selectedPatientUHID = '';
    this.resetForm();
  }

  deletePatient(patientId: string) {
    this.auth.deletePatient(patientId).subscribe({
      next: (response: any) => {
        this.notify.success(response.message || 'Patient deleted successfully');
        this.loadPatients();
        this.loadPatientStats();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || 'Unable To Delete Patient');
        this.cdr.markForCheck();
      },
    });
  }

  resetForm() {
    this.formData = {
      email: '',
      name: '',
      phone: '',
      gender: 'Male',
      date_of_birth: '',
      emergencyContact: '',
      status: true,
      address: {
        line1: '',
        city: '',
        postcode: '',
      },
    };
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'P';
  }

  calculateAge(date: string): number {
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
