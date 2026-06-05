import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
})
export class Appointment implements OnInit {
  /* APPOINTMENT DATA */
  appointments: any[] = [];
  doctors: any[] = [];

  totalAppointments = 0;
  bookedAppointments = 0;
  completedAppointments = 0;
  cancelledAppointments = 0;

  loading = true;

  /* ALERTS */
  successMessage = '';
  errorMessage = '';

  /* FORM */
  formData: any = {
    patientId: '',
    doctorEmployeeId: '',
    date: '',
    timeSlot: '',
    status: 'BOOKED',
  };

  constructor(private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.loadAppointmentUI();
  }

  /* LOAD APPOINTMENTS */
  loadAppointments() {
    this.loading = true;

    this.auth.getAllAppointments().subscribe({
      next: (response: any) => {
        console.log(response);
        this.appointments = response.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /* LOAD DOCTORS */
  loadDoctors() {
    this.auth.getDoctors().subscribe({
      next: (response: any) => {
        console.log(response);
        this.doctors = response.data || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.detectChanges();
      },
    });
  }

  /* LOAD UI */
  loadAppointmentUI() {
    this.auth.getAppointmentUI().subscribe({
      next: (response: any) => {
        console.log(response);
        this.totalAppointments = response.totalAppointments || 0;
        this.bookedAppointments = response.bookedAppointments || 0;
        this.completedAppointments = response.completedAppointments || 0;
        this.cancelledAppointments = response.cancelledAppointments || 0;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.detectChanges();
      },
    });
  }

  /* CREATE APPOINTMENT */
  createAppointment() {
    this.errorMessage = '';
    this.successMessage = '';

    console.log(this.formData);

    this.auth.createAppointment(this.formData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.successMessage = response.message;
        this.loadAppointments();
        this.loadAppointmentUI();
        this.resetForm();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.errorMessage =
          err?.error?.message || 'Unable To Create Appointment';
        this.cdr.detectChanges();
      },
    });
  }

  /* DELETE */
  deleteAppointment(appointmentId: string) {
    this.auth.deleteAppointment(appointmentId).subscribe({
      next: (response: any) => {
        console.log(response);
        this.loadAppointments();
        this.loadAppointmentUI();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.detectChanges();
      },
    });
  }

  /* RESET FORM */
  resetForm() {
    this.formData = {
      patientId: '',
      doctorEmployeeId: '',
      date: '',
      timeSlot: '',
      status: 'BOOKED',
    };
  }

  /* STATUS CLASS */
  getStatusClass(status: string) {
    if (status === 'BOOKED') return 'booked-status';
    if (status === 'COMPLETED') return 'completed-status';
    return 'cancelled-status';
  }
}
``