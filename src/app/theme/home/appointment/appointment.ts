import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentModel, AppointmentResponseModel } from '../../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { EmployeeModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { appointmentDateValidator } from '../../../validators/time-range-validator';

@Component({
  selector: 'app-appointment',
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;

  appointmentService: AppointmentService = inject(AppointmentService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  doctors: EmployeeModel[] = [];
  appointmentUiData: AppointmentResponseModel | null = null;
  appointments: AppointmentModel[] = [];
  doctorAppointments: AppointmentModel[] = [];

  // for setting doctor time slots
  doctorTimeSlots: string[] = [];

  employeeId = localStorage.getItem('employeeId');
  role = localStorage.getItem('role');

  public constructor(readonly fb: FormBuilder) {
    this.appointmentForm = this.fb.group(
      {
        patientId: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]*$/i)]],
        doctorEmployeeId: ['', Validators.required],
        date: ['', Validators.required],
        timeSlot: ['', Validators.required],
        createdByEmployeeId: [this.employeeId, Validators.required],
      },
      {
        validators: appointmentDateValidator,
      },
    );
  }

  ngOnInit(): void {
    this.loadUiData();
    // time slot container bug fix
    this.doctorTimeSlots.length = 0;
  }

  loadUiData() {
    this.appointmentService.getAppointmentUiData().subscribe({
      next: (res) => {
        this.appointmentUiData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });

    this.appointmentService.getAllDoctors().subscribe({
      next: (res) => {
        this.doctors = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });

    this.appointmentService.getAllAppointment().subscribe({
      next: (res) => {
        this.appointments = res;
        if (this.role === 'Doctor') {
          this.fetchDoctorAppointments(res);
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.message);
      },
    });
  }

  fetchDoctorAppointments(appointmentData: AppointmentModel[]) {
    this.doctorAppointments = appointmentData.filter(
      (apt) => apt.doctorEmployeeId === this.employeeId,
    );
  }

  onDoctorChange() {
    let doctorEmployeeId = this.appointmentForm.get('doctorEmployeeId')?.value;

    const inputDate = this.appointmentForm.get('date')?.value;
    const date = new Date(inputDate);

    let doctor = this.doctors?.find((d) => d.employeeCode === doctorEmployeeId);

    if (!date || !doctor) {
      this.doctorTimeSlots = [];
      return;
    }

    const allSlots = doctor?.availabilitySlots || [];

    // appointment before joining date
    if (date <= new Date(doctor.joiningDate)) {
      this.doctorTimeSlots = [];
      return;
    }

    const bookedSlots = this.appointments
      ?.filter((apt) => {
        const apt_date = new Date(apt.date);
        return (
          apt.doctorEmployeeId === doctor?.employeeCode &&
          apt_date.toDateString() === date.toDateString() &&
          apt.status != 'Cancelled'
        );
      })
      .map((apt) => apt.timeSlot);

    this.doctorTimeSlots = allSlots?.filter((slot) => !bookedSlots?.includes(slot)) || [];
    this.appointmentForm.patchValue({ timeSlot: '' });
    this.cd.detectChanges();
  }

  deleteAppointment(appointmentId: string) {
    const isConfirmed = confirm(
      `Are you sure you want to delete appointment ${appointmentId}? This action cannot be undone.`,
    );

    if (isConfirmed) {
      this.appointmentService.deleteAppointment(appointmentId).subscribe({
        next: (res) => {
          this.loadUiData();
          this.cd.detectChanges();
          this.toast.success(res.message);
        },
        error: (err) => {
          this.toast.error(err?.error?.message);
        },
      });
    }
  }

  editAppointmentStatus(appointmentId: string, status: string) {
    const payload = {
      status,
      appointmentId,
    };
    try {
      this.appointmentService.editAppointmentStatus(payload).subscribe({
        next: (res) => {
          const apt = this.appointments.find((a) => a.appointmentId === appointmentId);

          if (apt) {
            apt.status = status;
          }

          if (this.role === 'Doctor') {
            this.fetchDoctorAppointments(this.appointments);
          }

          this.loadUiData();
          this.cd.detectChanges();
          this.toast.success(res.message);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  onSubmit() {
    const payload = {
      patientId: this.appointmentForm.value.patientId,
      doctorEmployeeId: this.appointmentForm.value.doctorEmployeeId,
      date: this.appointmentForm.value.date,
      timeSlot: this.appointmentForm.value.timeSlot,
      status: 'Booked',
      createdByEmployeeId: this.appointmentForm.value.createdByEmployeeId,
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        this.loadUiData();
        this.cd.detectChanges();
        this.toast.success(res.message);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });

    this.appointmentForm.get('doctorEmployeeId')?.reset();
    this.doctorTimeSlots.length = 0;
  }
}
