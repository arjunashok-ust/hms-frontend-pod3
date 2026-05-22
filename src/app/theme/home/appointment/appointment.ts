import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ɵInternalFormsSharedModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { mapToAppointmentRequest } from '../../mapper/mapToAppointmentRequest';
import { AppointmentService } from '../../../services/appointment.service';
import { UserService } from '../../../services/user.service';
import { AppointmentModel } from '../../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { EmployeeModel } from '../../../models/user.model';
import { Observable, shareReplay } from 'rxjs';

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
  doctors: EmployeeModel[] | null = null;
  appointments: AppointmentModel[] | null = null;
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  // for setting doctor time slots
  doctorTimeSlots: string[] = [''];

  employeeId = localStorage.getItem('employeeId');
  employeeNameMap: { [key: string]: Observable<string> } = {};
  patientNameMap: { [key: string]: Observable<string> } = {};

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
        this.preloadNames();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log('Get Doctors Error : ', err);
      },
    });
  }

  preloadNames(){
    this.appointments?.forEach((app) => {
      if(!this.employeeNameMap[app.doctorEmployeeId]){
        this.employeeNameMap[app.doctorEmployeeId] = this.userService.getNameByEmployeeId(app.doctorEmployeeId);
      }
      if(!this.employeeNameMap[app.createdByEmployeeId]){
        this.employeeNameMap[app.createdByEmployeeId] = this.userService.getNameByEmployeeId(app.createdByEmployeeId);
      }
    })

    this.appointments?.forEach((app) => {
      if(!this.patientNameMap[app.patientId]){
        this.patientNameMap[app.patientId] = this.userService.getNameByPatientId(app.patientId);
      }
    })
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

  onSubmit() {
    const payload = mapToAppointmentRequest(this.appointmentForm);
    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        console.log(res);
        alert(res.message);
      },
      error: (err) => {
        console.log(err);
      },
    });
    this.appointmentForm.reset();
  }
}
