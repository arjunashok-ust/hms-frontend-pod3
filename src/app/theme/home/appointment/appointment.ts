import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ɵInternalFormsSharedModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user.service';
import { AppointmentModel, AppointmentResponseModel } from '../../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { EmployeeModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-appointment',
  imports: [RouterModule, ɵInternalFormsSharedModule, CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;

  appointmentService: AppointmentService = inject(AppointmentService);
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  doctors: EmployeeModel[] | null = null;
  appointmentUiData: AppointmentResponseModel | null = null;
  appointments: AppointmentModel[] | null = null;
  // for setting doctor time slots
  doctorTimeSlots: string[] = [''];
  date = Date.now();

  employeeId = localStorage.getItem('employeeId');

  public constructor(readonly fb: FormBuilder) {
    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorEmployeeId: ['', Validators.required],
      date: ['', Validators.required],
      timeSlot: ['', Validators.required],
      status: ['', Validators.required],
      createdByEmployeeId: [this.employeeId, Validators.required],
    });
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
        console.log('Appointment Ui Data Error : ', err);
      },
    });
    this.appointmentService.getAllDoctors().subscribe({
      next: (res) => {
        this.doctors = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log('Get Doctors Error : ', err);
      },
    });
    this.appointmentService.getAllAppointment().subscribe({
      next: (res) => {
        this.appointments = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log('Get Doctors Error : ', err);
      },
    });
  }

  onDoctorChange() {
    let employeeId = this.appointmentForm.get('doctorEmployeeId')?.value;
    let doctor = this.doctors?.find((d) => d.employeeCode === employeeId);
    if (doctor) {
      this.doctorTimeSlots = doctor.availabilitySlots || [''];
    } else {
      this.doctorTimeSlots = [];
    }
    this.appointmentForm.patchValue({ timeSlot: '' });
  }

  deleteAppointment(appointmentId: string) {
    const isConfirmed = confirm(
      `Are you sure you want to delete appointment ${appointmentId}? This action cannot be undone.`,
    );
    if (isConfirmed) {
      this.appointmentService.deleteAppointment(appointmentId).subscribe({
        next: (res) => {
          this.cd.detectChanges();
          this.toast.success(res.message);
        },
        error: (err) => {
          this.toast.error(err.message);
        },
      });
    }
  }

  onSubmit() {
    const payload = {
      patientId: this.appointmentForm.value.patientId,
      doctorEmployeeId: this.appointmentForm.value.doctorEmployeeId,
      date: this.appointmentForm.value.date,
      timeSlot: this.appointmentForm.value.timeSlot,
      status: this.appointmentForm.value.status,
      createdByEmployeeId: this.appointmentForm.value.createdByEmployeeId,
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        this.cd.detectChanges();
        this.toast.success(res.message);
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });
    this.appointmentForm.reset();
    this.doctorTimeSlots.length = 0;
  }
}
