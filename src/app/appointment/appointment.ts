import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';
import { PaginationControls } from '../shared/pagination-controls/pagination-controls';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, PaginationControls],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
})
export class Appointment implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  availableSlots: string[] = [];
  /* CURRENT USER ROLE */
  userRole = '';

  /* APPOINTMENT DATA */
  appointments: any[] = [];
  doctors: any[] = [];

  totalAppointments = 0;
  bookedAppointments = 0;
  completedAppointments = 0;
  cancelledAppointments = 0;

  loading = true;

  /* PAGINATION */
  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;
  hasPrevPage = false;

  /* ALERTS */
  successMessage = '';
  errorMessage = '';

  loggedInDoctorName = '';
  currentUser: any = null;
  /* FORM */
  formData: any = {
    patientId: '',
    doctorEmployeeId: '',
    date: '',
    timeSlot: '',
    status: 'BOOKED',
  };

  /* EDIT MODAL */
  showEditModal = false;
  selectedAppointmentId = '';
  editAvailableSlots: string[] = [];
  editFormData: any = {
    doctorEmployeeId: '',
    date: '',
    timeSlot: '',
    status: 'BOOKED',
  };

  constructor(
    readonly auth: Auth,
    readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe({
      next: (response: any) => {
        console.log('CURRENT USER => ', response);

        this.currentUser = response.data;

        this.userRole = response.data.role;

        if (response.data.role === 'doctor') {
          this.loggedInDoctorName = response.data.name;
        }

        this.loadDoctors();
        this.cdr.detectChanges();
      },

      error: (err: any) => {
        console.log(err);
      },
    });

    this.loadAppointments();
    this.loadAppointmentUI();
  }

  onDoctorChange() {
    const selectedDoctor = this.doctors.find(
      (doctor) => doctor.employeeId === this.formData.doctorEmployeeId,
    );

    this.availableSlots = selectedDoctor?.availabilitySlots || [];

    this.formData.timeSlot = '';
  }
  /* LOAD APPOINTMENTS */
  loadAppointments() {
    this.loading = true;

    this.auth.getAllAppointments({ page: this.currentPage, limit: 10 }).subscribe({
      next: (response: any) => {
        console.log(response);
        this.appointments = response.data || [];
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
      },
    });
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadAppointments();
  }

  /* LOAD DOCTORS */
  loadDoctors() {
    this.auth.getDoctors().subscribe({
      next: (response: any) => {
        console.log(response);

        this.doctors = response.data || [];

        if (this.userRole === 'doctor') {
          const loggedInDoctor = this.doctors.find(
            (doctor) => doctor.email === this.currentUser?.email,
          );

          if (loggedInDoctor) {
            this.loggedInDoctorName = loggedInDoctor.name;

            this.formData.doctorEmployeeId = loggedInDoctor.employeeId;

            this.availableSlots = loggedInDoctor.availabilitySlots || [];
          }
        }

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
        this.totalAppointments = response.data.totalAppointments || 0;
        this.bookedAppointments = response.data.bookedAppointments || 0;
        this.completedAppointments = response.data.completedAppointments || 0;
        this.cancelledAppointments = response.data.cancelledAppointments || 0;
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
        this.errorMessage = err?.error?.message || 'Unable To Create Appointment';
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
  /* EDIT — OPEN MODAL */
  openEditModal(appointment: any) {
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedAppointmentId = appointment.appointmentId;

    this.editFormData = {
      doctorEmployeeId: appointment.doctorEmployeeId,
      date: appointment.date ? appointment.date.split('T')[0] : '',
      timeSlot: appointment.timeSlot,
      status: appointment.status,
    };

    const selectedDoctor = this.doctors.find(
      (doctor) => doctor.employeeId === appointment.doctorEmployeeId,
    );
    this.editAvailableSlots = selectedDoctor?.availabilitySlots || [];

    this.showEditModal = true;
  }

  /* EDIT — CLOSE MODAL */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedAppointmentId = '';
  }

  /* EDIT — DOCTOR CHANGED */
  onEditDoctorChange() {
    const selectedDoctor = this.doctors.find(
      (doctor) => doctor.employeeId === this.editFormData.doctorEmployeeId,
    );
    this.editAvailableSlots = selectedDoctor?.availabilitySlots || [];
    this.editFormData.timeSlot = '';
  }

  /* EDIT — SUBMIT */
  submitEditAppointment() {
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.updateAppointment(this.selectedAppointmentId, this.editFormData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.successMessage = response.message;
        this.loadAppointments();
        this.loadAppointmentUI();
        this.closeEditModal();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.errorMessage = err?.error?.message || 'Unable To Update Appointment';
        this.cdr.detectChanges();
      },
    });
  }

  /* APPROVE */
  approveAppointment(appointmentId: string) {
    this.auth.approveAppointment(appointmentId).subscribe({
      next: (response: any) => {
        console.log(response);

        this.loadAppointments();
        this.loadAppointmentUI();
      },

      error: (err: any) => {
        console.log(err);
      },
    });
  }

  /* REJECT */
  rejectAppointment(appointmentId: string) {
    this.auth.rejectAppointment(appointmentId).subscribe({
      next: (response: any) => {
        console.log(response);

        this.loadAppointments();
        this.loadAppointmentUI();
      },

      error: (err: any) => {
        console.log(err);
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
    if (status === 'PENDING') return 'pending-status';

    if (status === 'BOOKED') return 'booked-status';

    if (status === 'COMPLETED') return 'completed-status';

    return 'cancelled-status';
  }
}
