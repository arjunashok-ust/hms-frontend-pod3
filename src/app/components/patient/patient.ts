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
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './patient.html',
  styleUrls: ['./patient.css'],
})
export class Patient implements OnInit {
  patients: any[] = [];
  isLoading = true;
  showAddModal = false;
  isEditMode = false;
  editingPatientId: string | null = null;
  newpatientForm!: FormGroup;
  modalError: string | null = null;
  isSubmittingModal = false;
  searchTerm: string = '';


  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 1;
  visiblePages: (number | string)[] = [];

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

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.apiService.getAllPatients(params).subscribe({
      next: (res: any) => {

        this.patients = res.data || [];
        this.totalRecords = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;

        this.generatePagesArray();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }


  generatePagesArray() {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 6) {
      this.visiblePages = Array.from({ length: total }, (_, i) => i + 1);
      return;
    }

    if (current <= 3) {
      this.visiblePages = [1, 2, 3, 4, '...', total];
    } else if (current >= total - 2) {
      this.visiblePages = [1, '...', total - 3, total - 2, total - 1, total];
    } else {
      this.visiblePages = [1, '...', current - 1, current, current + 1, '...', total];
    }
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchPatients();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchPatients();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchPatients();
    }
  }

  applyFilters() {
    this.currentPage = 1;
    this.fetchPatients();
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
      this.apiService.deletePatient(uhid).subscribe(() => {
        this.toast.success("Patient deleted successfully");
        this.fetchPatients();
      });
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
        this.toast.success(this.isEditMode ? 'Patient updated successfully!' : 'Patient created successfully!');
        this.fetchPatients();
        this.closeModal();
        this.isSubmittingModal = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || err.message);
        this.modalError = err.message;
        this.isSubmittingModal = false;
      },
    });
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 2).toUpperCase() : 'NA';
  }
}