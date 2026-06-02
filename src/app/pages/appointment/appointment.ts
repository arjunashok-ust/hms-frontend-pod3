import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appintment.service';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrls: ['./appointment.css']
})
export class AppointmentComponent implements OnInit {

  appointmentForm!: FormGroup;

  doctors: any[] = [];
  appointments: any[] = [];

  appointmentUiData: any = {
    total: 0,
    completed: 0,
    booked: 0,
    cancelled: 0
  };

  doctorTimeSlots: string[] = [];

  constructor(
  private fb: FormBuilder,
  private service: AppointmentService
) {}

  ngOnInit() {

    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      doctorEmployeeId: ['', Validators.required],
      date: ['', Validators.required],
      timeSlot: ['', Validators.required],
      status: ['BOOKED']
    });

    this.loadData();
  }

  loadData() {

    this.service.getAllAppointment().subscribe((res: any) => {
      this.appointments = res.data || res;

      // ✅ stats calculation
      this.appointmentUiData.total = this.appointments.length;
      this.appointmentUiData.booked =
        this.appointments.filter(a => a.status === 'BOOKED').length;
      this.appointmentUiData.completed =
        this.appointments.filter(a => a.status === 'COMPLETED').length;
      this.appointmentUiData.cancelled =
        this.appointments.filter(a => a.status === 'CANCELLED').length;
    });

    this.service.getAllDoctors().subscribe((res: any) => {
      this.doctors = res.data || res;
    });
  }

  onDoctorChange() {

    const doctorId = this.appointmentForm.get('doctorEmployeeId')?.value;
    const date = this.appointmentForm.get('date')?.value;

    if (!doctorId || !date) {
      this.doctorTimeSlots = [];
      return;
    }

    const allSlots = [
      "09:00 AM - 09:30 AM",
      "10:00 AM - 10:30 AM",
      "11:00 AM - 11:30 AM",
      "12:00 PM - 12:30 PM"
    ];

    const booked = this.appointments
      .filter(a =>
        a.doctorEmployeeId?._id === doctorId &&
        new Date(a.date).toDateString() === new Date(date).toDateString()
      )
      .map(a => a.timeSlot);

    this.doctorTimeSlots = allSlots.filter(s => !booked.includes(s));

    this.appointmentForm.patchValue({ timeSlot: '' });
  }

  onSubmit() {
    if (!this.appointmentForm.valid) return;

    this.service.createAppointment(this.appointmentForm.value)
      .subscribe(() => {
        alert("✅ Appointment Created");
        this.loadData();
        this.appointmentForm.reset();
      });
  }

  deleteAppointment(id: string) {
    if (!confirm("Delete appointment?")) return;

    this.service.deleteAppointment(id).subscribe(() => {
      this.loadData();
    });
  }
}
