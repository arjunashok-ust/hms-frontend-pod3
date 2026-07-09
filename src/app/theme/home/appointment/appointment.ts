import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
  toast: ToastrService = inject(ToastrService);

  doctors = signal<EmployeeModel[]>([]);
  patients = signal<PatientModel[]>([]);
  appointmentUiData = signal<AppointmentResponseModel | null>(null);
  appointments = signal<AppointmentModel[]>([]);
  doctorAppointments = signal<AppointmentModel[]>([]);
  displayedAppointments = signal<AppointmentModel[]>([]);

  isLoading = signal<boolean>(false);

  // for setting doctor time slots
  doctorTimeSlots = signal<string[]>([]);

  page = signal(1);
  totalPages = signal(1);
  limit = signal(10);
  searchText = signal('');

  employeeId = signal(localStorage.getItem('employeeId'));
  role = signal(localStorage.getItem('role'));

  doctorNameMap = signal<{ [key: string]: string }>({});
  patientNameMap = signal<{ [key: string]: string }>({});

  public constructor(readonly fb: FormBuilder) {
    this.appointmentForm = this.fb.group(
      {
        patientId: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]*$/i)]],
        doctorEmployeeId: ['', Validators.required],
        date: ['', Validators.required],
        timeSlot: ['', Validators.required],
        createdByEmployeeId: [this.employeeId(), Validators.required],
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
          this.patients.set(res.data);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error occured while getting patients');
        },
      });
    // time slot container bug fix
    this.doctorTimeSlots.set([]);
  }

  loadUiData() {
    this.appointmentService.getAppointmentUiData().subscribe({
      next: (res) => {
        this.appointmentUiData.set(res);
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });

    this.appointmentService.getAllDoctors().subscribe({
      next: (res) => {
        this.doctors.set(res);
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });
  }

  fetchAppointments() {
    this.appointmentService
      .getAllAppointment(this.searchText(), this.page(), this.limit())
      .subscribe({
        next: (res) => {
          if (res.data.length == 0) return;
          this.totalPages.set(res.totalPages);
          if (this.role() === 'Doctor') {
            this.fetchDoctorAppointments(res.data);
            this.displayedAppointments.set(this.doctorAppointments());
            this.totalPages.set(Math.ceil(this.displayedAppointments().length / this.limit()));
          } else {
            this.appointments.set(res.data);
            this.displayedAppointments.set(this.appointments());
          }
          this.mapDoctorAndPatients(res.data);
        },
        error: (err) => {
          this.toast.error(err?.message);
        },
      });
  }

  fetchDoctorAppointments(appointmentData: AppointmentModel[]) {
    this.doctorAppointments.set(
      appointmentData.filter((apt) => apt.doctorEmployeeId === this.employeeId()),
    );
  }

  minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  onDoctorChange() {
    const doctorEmployeeId = this.appointmentForm.get('doctorEmployeeId')?.value;

    const inputDate = this.appointmentForm.get('date')?.value;
    const date = new Date(inputDate);

    const doctor = this.doctors().find((d) => d.employeeCode === doctorEmployeeId);

    if (!date || !doctor) {
      this.doctorTimeSlots.set([]);
      return;
    }

    const allSlots = doctor?.availabilitySlots || [];

    // appointment before joining date
    if (date <= new Date(doctor.joiningDate)) {
      this.doctorTimeSlots.set([]);
      return;
    }

    const now = new Date();

    const bookedSlots = this.appointments()
      ?.filter((apt) => {
        const apt_date = new Date(apt.date);
        return (
          apt.doctorEmployeeId === doctor?.employeeCode &&
          apt_date.toDateString() === date.toDateString() &&
          apt.status != 'Cancelled'
        );
      })
      .map((apt) => apt.timeSlot);

    this.doctorTimeSlots.set(
      allSlots?.filter((slot) => {
        if (bookedSlots?.includes(slot)) return false;

        const startTime = slot.split('-')[0];
        const [hour, minute] = startTime.split(':').map((s) => Number.parseInt(s.trim(), 10));

        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        if (date.toDateString() == slotTime.toDateString()) {
          return slotTime > now;
        }

        return true;
      }) || [],
    );

    this.appointmentForm.patchValue({ timeSlot: '' });
  }

  deleteAppointment(appointmentId: string) {
    const isConfirmed = confirm(
      `Are you sure you want to delete appointment ${appointmentId}? This action cannot be undone.`,
    );

    if (isConfirmed) {
      this.appointmentService.deleteAppointment(appointmentId, this.employeeId() ?? '').subscribe({
        next: (res) => {
          this.loadUiData();
          this.fetchAppointments();
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
          const apt = this.appointments().find((a) => a.appointmentId === appointmentId);

          if (apt) {
            apt.status = status;
          }

          if (this.role() === 'Doctor') {
            this.fetchDoctorAppointments(this.appointments());
          }

          this.loadUiData();
          this.fetchAppointments();

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
      if (appointment.patientId && !this.patientNameMap()[appointment.patientId]) {
        this.userService.getPatientById(appointment.patientId).subscribe((res) => {
          this.patientNameMap.update((map) => ({
            ...map,
            [appointment.patientId]: res.name,
          }));
        });
      }
      // doctor name map
      if (appointment.doctorEmployeeId && !this.doctorNameMap()[appointment.doctorEmployeeId]) {
        this.userService.getDoctorById(appointment.doctorEmployeeId).subscribe((res) => {
          this.doctorNameMap.update((map) => ({
            ...map,
            [appointment.doctorEmployeeId]: res.name,
          }));
        });
      }
    });
  }

  trackFn(index: number, item: AppointmentModel) {
    return item.appointmentId;
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
    this.fetchAppointments();
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
    }
    this.fetchAppointments();
  }

  goToPage(index: number) {
    this.page.set(index);
    this.fetchAppointments();
  }

  onSubmit() {
    if (this.appointmentForm.invalid) {
      this.toast.warning('Validation failed,please check all the input fields');
      return;
    }

    this.isLoading.set(true);

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
        this.isLoading.set(false);
        this.appointmentForm.get('doctorEmployeeId')?.reset();
        this.doctorTimeSlots.set([]);
        this.toast.success(res.message);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
