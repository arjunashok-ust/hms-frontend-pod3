import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';
import { PaginationControls } from '../shared/pagination-controls/pagination-controls';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, PaginationControls],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
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

  successMessage = '';
  errorMessage = '';
//Max Date
  maxDate = new Date().toISOString().split('T')[0];
  formData: any = {
    name: '',
    phone: '',
    gender: 'Male',
    date_of_birth: '',
    emergencyContact: '',
    status: true,
    address: {
      line1: '',
      city: '',
      postcode: ''
    }
  };

  constructor(readonly auth: Auth, readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {

     if (globalThis.window)  {

      const token = localStorage.getItem('token');

      console.log('PATIENT TOKEN', token);

      if (token) {

        this.loadPatients();
        this.loadPatientStats();

      }

      else {

        this.errorMessage = 'No token found';

      }

    }

  }

  loadPatientStats() {
    this.auth.getPatientUI().subscribe({
      next: (response: any) => {
        console.log(response);
        this.activePatients = response.data.activePatients || 0;
        this.inactivePatients = response.data.inactivePatients || 0;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
      }
    });
  }

  loadPatients() {
    this.loading = true;
    this.auth.getAllPatients({ page: this.currentPage, limit: 10 }).subscribe({
      next: (response: any) => {
        console.log(response);
        this.patients = response.data || [];
        this.totalPatients = response.meta?.totalCount || 0;
        this.totalPages = response.meta?.totalPages || 1;
        this.hasNextPage = response.meta?.hasNextPage || false;
        this.hasPrevPage = response.meta?.hasPrevPage || false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadPatients();
  }

  createPatient(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    console.log(this.formData);

    if (this.isEditMode) {
      this.auth.updatePatient(this.selectedPatientUHID, this.formData).subscribe({
        next: (response: any) => {
          console.log(response);
          this.successMessage = response.message;
          this.loadPatients();
          this.loadPatientStats();
          this.cancelEdit();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.log(err);
          this.errorMessage = err?.error?.message || 'Unable To Update Patient';
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.auth.createPatient(this.formData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.successMessage = response.message;
        this.loadPatients();
        this.loadPatientStats();
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.errorMessage = err?.error?.message || 'Unable To Create Patient';
        this.cdr.detectChanges();
      }
    });
  }

  editPatient(patient: any) {
    this.isEditMode = true;
    this.selectedPatientUHID = patient.UHID;

    this.formData = {
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      emergencyContact: patient.emergencyContact,
      status: patient.status,
      address: {
        line1: patient.address?.line1 || '',
        city: patient.address?.city || '',
        postcode: patient.address?.postcode || ''
      }
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
        console.log(response);
        this.loadPatients();
        this.loadPatientStats();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.formData = {
      name: '',
      phone: '',
      gender: 'Male',
      date_of_birth: '',
      emergencyContact: '',
      status: true,
      address: {
        line1: '',
        city: '',
        postcode: ''
      }
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