import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

  appointmentService = inject(AppointmentService);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  doctors: EmployeeModel[] = [];
  appointmentUiData: AppointmentResponseModel | null = null;
  appointments: AppointmentModel[] = [];

  doctorTimeSlots: string[] = [];

  employeeId = JSON.parse(localStorage.getItem('employeeData') || '{}')?.employeeId || '';

  constructor(private fb: FormBuilder) {
    this.appointmentForm = this.fb.group(
      {
        patientId: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/)]],
        doctorEmployeeId: ['', Validators.required],
        date: ['', Validators.required],
        timeSlot: ['', Validators.required],
        status: ['BOOKED'],
        createdByEmployeeId: [this.employeeId],
      },
      {
        validators: appointmentDateValidator,
      }
    );
  }

  ngOnInit(): void {
    this.loadUiData();
    this.cd.detectChanges();
  }

  loadUiData(): void {
    this.appointmentService.getAppointmentUiData().subscribe(res => this.appointmentUiData = res);
    this.appointmentService.getAllDoctors().subscribe(res => this.doctors = res);
    this.appointmentService.getAllAppointment().subscribe(res => this.appointments = res);
  }

  onDoctorChange(): void {
    const doctorId = this.appointmentForm.get('doctorEmployeeId')?.value;
    const dateValue = this.appointmentForm.get('date')?.value;

    if (!doctorId || !dateValue) {
      this.doctorTimeSlots = [];
      return;
    }

    const selectedDoctor = this.doctors.find(d => d.employeeId === doctorId);

    if (!selectedDoctor) return;

    const booked = this.appointments
      .filter(a =>
        a.doctorEmployeeId === doctorId &&
        new Date(a.date).toISOString() === new Date(dateValue).toISOString() &&
        a.status !== 'CANCELLED'
      )
      .map(a => a.timeSlot);

    this.doctorTimeSlots =
      selectedDoctor.availabilitySlots?.filter(slot => !booked.includes(slot)) || [];

    this.appointmentForm.patchValue({ timeSlot: '' });
  }

  deleteAppointment(id: string): void {
    this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.toast.success('Deleted successfully');
        this.loadUiData();
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) return;

    this.appointmentService.createAppointment(this.appointmentForm.value).subscribe({
      next: () => {
        this.toast.success('Appointment booked');
        this.loadUiData();
        this.appointmentForm.reset({ status: 'BOOKED', createdByEmployeeId: this.employeeId });
      },
      error: (err) => this.toast.error(err.message),
    });
  }
}