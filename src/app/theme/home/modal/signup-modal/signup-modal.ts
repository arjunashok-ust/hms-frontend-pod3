import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import {
  DepartmentModel,
  RoleModel,
  SpecializationModel,
} from '../../../../models/ui.model';

import { AuthService } from '../../../../services/auth.service';
import { mapToSignUpRequest } from '../../../mapper/mapToSignUpRequest';
import {
  futureDateValidator,
  timeRangeValidator,
} from '../../../../validators/time-range-validator';

@Component({
  selector: 'app-signup-modal',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './signup-modal.html',
  styleUrl: './signup-modal.css',
})
export class SignUpModalComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly toast = inject(ToastrService);
  readonly cd = inject(ChangeDetectorRef);
  readonly router = inject(Router);
  readonly fb = inject(FormBuilder);

  signUpModalForm: FormGroup;
  isLoading = false;

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  hours = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];

  constructor() {
    this.signUpModalForm = this.buildForm();
  }

  ngOnInit(): void {
    this.loadUiData();
  }

  private buildForm(): FormGroup {
    return this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.pattern(/^[a-z0-9._]+@[a-z0-9]+\.[a-z]{2,}$/i),
          ],
        ],
        role: ['', Validators.required],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['Active'],
        joiningDate: ['', Validators.required],
        medicalRegistrationNo: ['', Validators.pattern(/^[a-z0-9]*$/i)],
        specialization: [''],
        qualification: ['', [Validators.pattern(/^[a-z]+([ -][a-z]+)*$/i),Validators.required]],
        consultationFee: [''],
        startHour: [''],
        endHour: [''],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: [timeRangeValidator, futureDateValidator],
      }
    );
  }

  private loadUiData() {
    this.fetchData<RoleModel[]>('/ui/getRoles', (res) => (this.roles_data = res));
    this.fetchData<DepartmentModel[]>('/ui/getDepartments', (res) => (this.departments_data = res));
    this.fetchData<SpecializationModel[]>('/ui/getSpecializations', (res) => (this.specializations_data = res));
  }

  private fetchData<T>(url: string, assign: (data: T) => void) {
    this.auth.getUiData<T>(url).subscribe((res) => {
      assign(res);
      this.cd.detectChanges();
    });
  }

  get availabilitySlots(): FormArray {
    return this.signUpModalForm.get('availabilitySlots') as FormArray;
  }

  generateTimeSlots() {
    const { startHour, endHour } = this.signUpModalForm.value;

    if (!startHour || !endHour) return;

    const start = Number(startHour);
    const end = Number(endHour);

    if (start >= end) return;

    this.generatedSlots = [];

    for (let i = start; i < end; i++) {
      this.generatedSlots.push(
        `${this.formatHour(i)} : 00 - ${this.formatHour(i)} : 30`,
        `${this.formatHour(i)} : 30 - ${this.formatHour(i + 1)} : 00`
      );
    }
  }

  toggleSlot(slot: string) {
    const index = this.availabilitySlots.value.indexOf(slot);

    if (index > -1) {
      this.availabilitySlots.removeAt(index);
    } else {
      this.availabilitySlots.push(this.fb.control(slot));
    }
  }

  private formatHour(hour: number): string {
    return hour.toString().padStart(2, '0');
  }

  onSubmit() {
    if (this.signUpModalForm.invalid) {
      this.toast.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    const payload = mapToSignUpRequest(this.signUpModalForm);

    this.auth.signUp(payload).subscribe({
      next: (res) => this.handleSuccess(res),
      error: (err) => this.handleError(err),
    });
  }

  private handleSuccess(res: any) {
    this.isLoading = false;
    this.cd.detectChanges();
    this.toast.success(res.message);
    this.router.navigate(['/employee']);
  }

  private handleError(err: any) {
    this.isLoading = false;
    this.cd.detectChanges();
    this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
  }
}