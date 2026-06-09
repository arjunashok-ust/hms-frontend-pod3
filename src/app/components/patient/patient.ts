import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient.html',
  styleUrls: ['./patient.css'],
})
export class Patient implements OnInit {
  patients: any[] = [];
  filteredpatients: any[] = [];
  isLoading = true;
  showAddModal = false;
  isEditMode = false;
  editingPatientId: string | null = null;
  newpatientForm!: FormGroup;
  modalError: string | null = null;
  isSubmittingModal = false;
  searchTerm: string = '';
  toast: ToastrService = inject(ToastrService);

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.fetchPatients();
  }

  initForm() {
    this.newpatientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      gender: ['Male', Validators.required],
      dob: ['', [Validators.required, this.noFutureDateValidator]],
      emergencyContact: [''],
      address: this.fb.group({
        line1: ['', Validators.required],
        line2: [''],
        state: ['', Validators.required],
        pincode: ['', Validators.required],
      }),
      status: [true],
    });
  }

  getMaxDate(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  getMinDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d.toISOString().split('T')[0];
  }

  noFutureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? { futureDate: true } : null;
  }

  fetchPatients() {
    this.isLoading = true;
    this.apiService.getAllPatients().subscribe({
      next: (data) => {
        const patients = data as any[];
        this.patients = patients;
        this.filteredpatients = patients;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  applyFilters() {
    this.filteredpatients = this.patients.filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  openModal() {
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.isEditMode = false;
    this.editingPatientId = null;
    this.newpatientForm.reset({ status: true, gender: 'Male' });
  }

  editPatient(pat: any) {
    this.isEditMode = true;
    this.editingPatientId = pat.UHID;
    this.newpatientForm.patchValue(pat);
    this.showAddModal = true;
  }

  deletePatient(uhid: string) {
    if (confirm('Delete patient?')) {
      this.apiService.deletePatient(uhid).subscribe(() => this.fetchPatients());
    }
  }

  onSubmitNewpatient() {
    if (this.newpatientForm.invalid) return;
    this.isSubmittingModal = true;
    const payload = this.newpatientForm.value;

    const action$ = this.isEditMode
      ? this.apiService.updatePatient(this.editingPatientId!, payload)
      : this.apiService.createPatient(payload);

    action$.subscribe({
      next: () => {
        this.toast.success('Patient created successfully!');
        this.fetchPatients();
        this.closeModal();
        this.isSubmittingModal = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message);
        this.modalError = err.message;
        this.isSubmittingModal = false;
      },
    });
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }
}
