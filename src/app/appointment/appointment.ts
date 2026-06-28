import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Auth } from '../services/auth';
import { NotificationService } from '../services/notification';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, Pagination],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  patients: any[] = [];

  /* Earliest selectable date = today (blocks past-date booking) */
  minDate = new Date().toISOString().split('T')[0];

  /* Raw slots of the selected doctor, before past-time filtering */
  private doctorSlots: string[] = [];

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
    readonly notify: NotificationService,
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
        this.cdr.markForCheck();
      },

      error: (err: any) => {
        console.log(err);
      },
    });

    this.loadAppointments();
    this.loadAppointmentUI();
    this.loadPatients();
  }

  /* LOAD PATIENTS (all, for the dropdown — same idea as doctors) */
  loadPatients() {
    this.auth.getAllPatients({ limit: 100 }).subscribe({
      next: (response: any) => {
        this.patients = response.data || [];
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.log(err);
      },
    });
  }

  onDoctorChange() {
    const selectedDoctor = this.doctors.find(
      (doctor) => doctor.employeeId === this.formData.doctorEmployeeId,
    );

    this.doctorSlots = selectedDoctor?.availabilitySlots || [];
    this.formData.timeSlot = '';
    this.refreshSlots();
  }

  /* DATE CHANGED — re-filter slots (drop past times if the date is today) */
  onDateChange() {
    this.formData.timeSlot = '';
    this.refreshSlots();
  }

  /* Show only slots that haven't already passed when booking for today;
     future dates show all of the doctor's slots. */
  private refreshSlots() {
    const today = new Date().toISOString().split('T')[0];

    if (!this.formData.date || this.formData.date !== today) {
      this.availableSlots = [...this.doctorSlots];
      return;
    }

    const now = new Date();
    this.availableSlots = this.doctorSlots.filter((slot) => {
      const start = this.slotStartDate(slot, this.formData.date);
      return start ? start.getTime() > now.getTime() : true;
    });
  }

  /* Parses an appointment day + a slot's START time ("9:00 AM - 9:30 AM" -> 9:00)
     into a Date so past slots can be filtered out. Returns null if unparseable. */
  private slotStartDate(slot: string, dateStr: string): Date | null {
    if (!slot || !dateStr) return null;

    const startStr = slot.split(' - ')[0]?.trim();
    const [time, period] = (startStr || '').split(' ');
    if (!time || !period) return null;

    let [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }
  /* LOAD APPOINTMENTS */
  loadAppointments() {
    this.loading = true;

    this.auth.getAllAppointments({ page: this.currentPage, limit: 5 }).subscribe({
      next: (response: any) => {
        console.log(response);
        this.appointments = response.data || [];
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
    /* Ignore clicks while a page request is in flight (dup-request + race guard). */
    if (this.loading) return;
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

            this.doctorSlots = loggedInDoctor.availabilitySlots || [];
            this.refreshSlots();
          }
        }

        this.cdr.markForCheck();
      },

      error: (err: any) => {
        console.log(err);
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.markForCheck();
      },
    });
  }

  /* CREATE APPOINTMENT */
  createAppointment() {
    this.auth.createAppointment(this.formData).subscribe({
      next: (response: any) => {
        this.notify.success(response.message || 'Appointment Created Successfully');
        this.loadAppointments();
        this.loadAppointmentUI();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || 'Unable To Create Appointment');
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.log(err);
        this.cdr.markForCheck();
      },
    });
  }
  /* EDIT — OPEN MODAL */
  openEditModal(appointment: any) {
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
    this.auth.updateAppointment(this.selectedAppointmentId, this.editFormData).subscribe({
      next: (response: any) => {
        this.notify.success(response.message || 'Appointment Updated Successfully');
        this.loadAppointments();
        this.loadAppointmentUI();
        this.closeEditModal();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.notify.error(err?.error?.message || 'Unable To Update Appointment');
        this.cdr.markForCheck();
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
