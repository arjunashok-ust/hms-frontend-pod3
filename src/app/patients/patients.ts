import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css'
})

export class Patients implements OnInit {

  patients: any[] = [];
  totalPatients = 0;
  loading = true;

  successMessage = '';
  errorMessage = '';

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

  constructor(private auth: Auth, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {

    if (typeof window !== 'undefined') {

      const token = localStorage.getItem('token');

      console.log('PATIENT TOKEN', token);

      if (token) {

        this.loadPatients();

      }

      else {

        this.errorMessage = 'No token found';

      }

    }

  }

  loadPatients() {
    this.loading = true;
    this.auth.getAllPatients().subscribe({
      next: (response: any) => {
        console.log(response);
        this.patients = response.data || [];
        this.totalPatients = response.count || 0;
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

  createPatient() {
    this.errorMessage = '';
    this.successMessage = '';
    console.log(this.formData);
    this.auth.createPatient(this.formData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.successMessage = response.message;
        this.loadPatients();
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

  deletePatient(patientId: string) {
    this.auth.deletePatient(patientId).subscribe({
      next: (response: any) => {
        console.log(response);
        this.loadPatients();
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