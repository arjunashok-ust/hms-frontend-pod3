import { Component, inject,OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AppointmentService } from '../../services/appointmentService/appointment-service';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrls: ['./appointment.css']
})
export class Appointment implements OnInit {
  appointmentForm!: FormGroup;
  stats: any = { total: 0, completed: 0, booked: 0, cancelled: 0 };
  doctors: any[] = [];
  patients: any[] = [];
  recentAppointments: any[] = [];
  currentUser: any = null;
  isSubmitting = false;
  isEditMode = false;
  editingAptCode: string | null = null;
  userRole: string = '';
  timeSlots: string[] = [];


  isPatientDropdownOpen = false;
  displayPatients: any[] = [];
  selectedPatientDisplay = '';

  isDoctorDropdownOpen = false;
  displayDoctors: any[] = [];
  selectedDoctorDisplay = '';

  toast: ToastrService = inject(ToastrService);
  constructor(
    private readonly fb: FormBuilder,
    private readonly appointmentService: AppointmentService,
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    this.initForm();
  }

  getMinDate(): string {
    const d = new Date();
    if (this.userRole === 'ADMIN') {
      d.setDate(d.getDate());
    }
    return d.toISOString().split('T')[0];
  }

  pastDateValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (this.userRole === 'ADMIN') {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(today.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      if (selectedDate < twoDaysAgo) {
        return { pastDateTooFar: true };
      }
    } else if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchCurrentUser();

      this.appointmentForm.get('doctorEmployeeID')?.valueChanges.subscribe(() => {
        this.updateDynamicTimeSlots();
      });

      this.appointmentForm.get('date')?.valueChanges.subscribe(() => {
        this.updateDynamicTimeSlots();
      });
    }
  }

  initForm() {
    this.appointmentForm = this.fb.group({
      patientID: ['', Validators.required],
      doctorEmployeeID: ['', Validators.required],
      date: ['', [Validators.required, this.pastDateValidator]],
      timeSlot: ['', Validators.required],
      status: ['Scheduled', Validators.required]
    });
  }

  loadData() {
    if (this.userRole !== 'DOCTOR') {
      this.appointmentService.getStats().subscribe(data => {
        this.stats = data;
        this.cdr.markForCheck();
      });
    }

    this.appointmentService.getDoctors().subscribe(data => {
      this.doctors = data;
      this.displayDoctors = [...this.doctors];
      this.cdr.markForCheck();
    });

    this.apiService.getAllPatients().subscribe({
      next: (data: any) => {
        this.patients = data.filter((pat: any) =>
          String(pat.status).toUpperCase() === 'ACTIVE' || String(pat.status) === 'true'
        );
        this.displayPatients = [...this.patients];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to fetch patients', err)
    });

    this.fetchRecentAppointments();
  }

  fetchRecentAppointments() {
    this.appointmentService.getRecentAppointments().subscribe(data => {
      if (this.userRole === 'DOCTOR') {
        this.recentAppointments = data.filter((apt: any) =>
          apt.doctorEmployeeID === this.currentUser?.employeeCode
        );

        this.stats = {
          total: this.recentAppointments.length,
          completed: this.recentAppointments.filter((a: any) => a.status === 'Completed').length,
          booked: this.recentAppointments.filter((a: any) => a.status === 'Scheduled').length,
          cancelled: this.recentAppointments.filter((a: any) => a.status === 'Cancelled').length
        };
      } else {
        this.recentAppointments = data;
      }
      this.cdr.detectChanges();
    });
  }

  fetchCurrentUser() {
    this.apiService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.currentUser = response.user?.profile || response.user || response;
        this.userRole = this.getRoleFromToken().toUpperCase();
        this.loadData();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to fetch user', err)
    });
  }

  filterPatients(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.isPatientDropdownOpen = true;
    this.selectedPatientDisplay = (event.target as HTMLInputElement).value;

    this.displayPatients = this.patients.filter(pat =>
      pat.name.toLowerCase().includes(term) ||
      pat.UHID.toLowerCase().includes(term)
    );
  }

  selectPatient(pat: any) {
    this.appointmentForm.patchValue({ patientID: pat.UHID });
    this.selectedPatientDisplay = `${pat.name} (${pat.UHID})`;
    this.isPatientDropdownOpen = false;
    this.displayPatients = [...this.patients];
  }

  closePatientDropdown() {
    setTimeout(() => {
      this.isPatientDropdownOpen = false;

      const currentVal = this.appointmentForm.get('patientID')?.value;
      if (currentVal) {
        const pat = this.patients.find(p => p.UHID === currentVal);
        this.selectedPatientDisplay = pat ? `${pat.name} (${pat.UHID})` : currentVal;
      } else {
        this.selectedPatientDisplay = '';
      }
      this.cdr.markForCheck();
    }, 200);
  }

  filterDoctors(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.isDoctorDropdownOpen = true;
    this.selectedDoctorDisplay = (event.target as HTMLInputElement).value;

    this.displayDoctors = this.doctors.filter(doc =>
      doc.name.toLowerCase().includes(term) ||
      doc.employeeCode.toLowerCase().includes(term) ||
      (doc.department?.toLowerCase().includes(term))
    );
  }

  selectDoctor(doc: any) {
    this.appointmentForm.patchValue({ doctorEmployeeID: doc.employeeCode });
    this.selectedDoctorDisplay = `${doc.name} (${doc.department || 'General'})`;
    this.isDoctorDropdownOpen = false;
    this.displayDoctors = [...this.doctors];
  }

  closeDoctorDropdown() {
    setTimeout(() => {
      this.isDoctorDropdownOpen = false;
      const currentVal = this.appointmentForm.get('doctorEmployeeID')?.value;
      if (currentVal) {
        const doc = this.doctors.find(d => d.employeeCode === currentVal);
        this.selectedDoctorDisplay = doc ? `${doc.name} (${doc.department || 'General'})` : currentVal;
      } else {
        this.selectedDoctorDisplay = '';
      }
      this.cdr.markForCheck();
    }, 200);
  }

  onSubmit() {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.editingAptCode) {
      this.appointmentService.updateAppointment(this.editingAptCode, this.appointmentForm.value).subscribe({
        next: () => {
          this.toast.success('Appointment updated successfully!');
          this.appointmentForm.reset({ status: 'Scheduled' });
          this.selectedPatientDisplay = '';
          this.selectedDoctorDisplay = '';
          this.cancelEdit();
          this.loadData();
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error('Error updating appointment. ' + (err.error?.message || ''));
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.appointmentService.bookAppointment(this.appointmentForm.value).subscribe({
        next: () => {
          this.toast.success('Appointment booked successfully!');
          this.appointmentForm.reset({ status: 'Scheduled' });
          this.selectedPatientDisplay = '';
          this.loadData();
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error('Error booking appointment. ' + (err.error?.message || ''));
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }

  updateDynamicTimeSlots(preservedSlot?: string) {
    const doctorId = this.appointmentForm.get('doctorEmployeeID')?.value;
    const date = this.appointmentForm.get('date')?.value;

    if (doctorId && date) {
      this.appointmentService.getAvailableSlots(doctorId, date).subscribe({
        next: (slots: any[]) => {
          this.timeSlots = slots.map(slot => {
            if (typeof slot === 'object' && slot.startTime && slot.endTime) {
              return `${slot.startTime} - ${slot.endTime}`;
            }
            return String(slot);
          });

          if (preservedSlot && !this.timeSlots.includes(preservedSlot)) {
            this.timeSlots.push(preservedSlot);
          }

          const currentSlot = this.appointmentForm.get('timeSlot')?.value;
          if (currentSlot && !this.timeSlots.includes(currentSlot)) {
            this.appointmentForm.patchValue({ timeSlot: '' }, { emitEvent: false });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching slots:', err);
          this.timeSlots = [];
          this.appointmentForm.patchValue({ timeSlot: '' }, { emitEvent: false });
          this.cdr.markForCheck();
        }
      });
    } else {
      this.timeSlots = [];
      this.appointmentForm.patchValue({ timeSlot: '' }, { emitEvent: false });
      this.cdr.markForCheck();
    }
  }

  editAppointment(apt: any) {
    this.isEditMode = true;
    this.editingAptCode = apt.appointmentCode;

    const formattedDate = new Date(apt.date).toISOString().split('T')[0];

    this.appointmentForm.patchValue({
      patientID: apt.patientID,
      doctorEmployeeID: apt.doctorEmployeeID,
      date: formattedDate,
      timeSlot: apt.timeSlot,
      status: apt.status
    }, { emitEvent: false });

    const pat = this.patients.find(p => p.UHID === apt.patientID);
    this.selectedPatientDisplay = pat ? `${pat.name} (${pat.UHID})` : apt.patientID;

    const doc = this.doctors.find(d => d.employeeCode === apt.doctorEmployeeID);
    this.selectedDoctorDisplay = doc ? `${doc.name} (${doc.department || 'General'})` : apt.doctorEmployeeID;
    this.updateDynamicTimeSlots(apt.timeSlot);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingAptCode = null;
    this.appointmentForm.reset({ status: 'Scheduled' });
    this.selectedPatientDisplay = '';
    this.selectedDoctorDisplay = '';
    this.timeSlots = [];
  }

  deleteAppointment(appointmentCode: string) {
    const isConfirmed = confirm(`Are you sure you want to delete appointment ${appointmentCode}? This action cannot be undone.`);

    if (isConfirmed) {
      this.appointmentService.deleteAppointment(appointmentCode).subscribe({
        next: () => {
          this.toast.success('Appointment deleted successfully!');
          this.loadData();
        },
        error: (err) => {
          this.toast.error('Error deleting appointment: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }

  private getRoleFromToken(): string {
    if (globalThis.window === undefined || !globalThis.localStorage) {
      return '';
    }

    const token = localStorage.getItem('token');
    if (!token) return '';

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
      const decodedPayload = JSON.parse(decodedJson);

      return decodedPayload.role || '';
    } catch (error) {
      console.error('Failed to decode JWT token', error);
      return '';
    }
  }

  markAsCompleted(apt: any) {
    const isConfirmed = confirm(`Mark appointment ${apt.appointmentCode} as Completed?`);

    if (isConfirmed) {
      const payload = { ...apt, status: 'Completed' };

      this.appointmentService.updateAppointment(apt.appointmentCode, payload).subscribe({
        next: () => {
          this.toast.success('Appointment marked as completed!');
          this.loadData();
        },
        error: (err) => {
          this.toast.error('Error updating status: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }
}