import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { AppointmentModel, AppointmentResponseModel } from '../../../models/appointment.model';
import { CommonModule } from '@angular/common';
import { EmployeeModel, PatientModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { appointmentDateValidator } from '../../../validators/time-range-validator';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';
import { UserService } from '../../../services/user.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-appointment',
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    HasPermissionDirective,
    FormsModule,
    MatAutocompleteModule,
  ],
  templateUrl: './appointment.html',
  styleUrl: './appointment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;

  appointmentService: AppointmentService = inject(AppointmentService);
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  doctors: EmployeeModel[] = [];
  patients: PatientModel[] = [];
  appointmentUiData: AppointmentResponseModel | null = null;
  appointments: AppointmentModel[] = [];
  doctorAppointments: AppointmentModel[] = [];
  displayedAppointments: AppointmentModel[] = [];

  isLoading: boolean = false;

  // for setting doctor time slots
  doctorTimeSlots: string[] = [];

  page: number = 1;
  totalPages: number = 1;
  limit: number = 5;
  searchText: string = '';

  employeeId = localStorage.getItem('employeeId');
  role = localStorage.getItem('role');

  doctorNameMap: { [key: string]: string } = {};
  patientNameMap: { [key: string]: string } = {};

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
    this.fetchAppointments();
    this.loadUiData();

    this.appointmentForm
      .get('patientId')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => !!value?.trim()),
        switchMap((value) => this.userService.getPatients(value, 1, 5)),
      )
      .subscribe({
        next: (res) => {
          if (res.data.length == 0) return;
          this.patients = res.data;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error occured while getting patients');
        },
      });
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
  }

  fetchAppointments() {
    this.appointmentService.getAllAppointment(this.searchText, this.page, this.limit).subscribe({
      next: (res) => {
        if (res.data.length == 0) return;
        this.totalPages = res.totalPages;
        if (this.role === 'Doctor') {
          this.fetchDoctorAppointments(res.data);
          this.displayedAppointments = this.doctorAppointments;
        } else {
          this.appointments = res.data;
          this.displayedAppointments = this.appointments;
        }
        this.mapDoctorAndPatients(res.data);
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
      this.appointmentService.deleteAppointment(appointmentId, this.employeeId ?? '').subscribe({
        next: (res) => {
          this.loadUiData();
          this.fetchAppointments();
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
          this.fetchAppointments();

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

  mapDoctorAndPatients(appointments: AppointmentModel[]) {
    appointments.forEach((appointment) => {
      // patient name map
      if (appointment.patientId && !this.patientNameMap[appointment.patientId]) {
        this.userService.getPatientById(appointment.patientId).subscribe((res) => {
          this.patientNameMap[appointment.patientId] = res.name;
          this.cd.detectChanges();
        });
      }
      // doctor name map
      if (appointment.doctorEmployeeId && !this.doctorNameMap[appointment.doctorEmployeeId]) {
        this.userService.getDoctorById(appointment.doctorEmployeeId).subscribe((res) => {
          this.doctorNameMap[appointment.doctorEmployeeId] = res.name;
          this.cd.detectChanges();
        });
      }
    });
  }

  trackFn(index: number, item: AppointmentModel) {
    return item.appointmentId;
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
    this.fetchAppointments();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
    this.fetchAppointments();
  }

  goToPage(index: number) {
    this.page = index;
    this.fetchAppointments();
  }

  onSubmit() {
    this.isLoading = true;
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
        this.fetchAppointments();
        this.isLoading = false;
        this.cd.detectChanges();
        this.toast.success(res.message);
      },
      error: (err) => {
        this.isLoading = false;
        this.cd.detectChanges();
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });

    this.appointmentForm.get('doctorEmployeeId')?.reset();
    this.doctorTimeSlots.length = 0;
  }
}
