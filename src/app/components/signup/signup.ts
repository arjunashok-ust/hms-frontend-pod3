/**
 * @file signup.ts
 * @description
 * This file defines the component for the employee self-registration page.
 *
 * @overview
 * This component provides a public form for new employees to sign up for an account.
 * It features a complex reactive form with custom validators and dynamic fields that appear based on the selected role (e.g., availability slots for doctors).
 * Upon submission, it sends the registration data to the backend via the `Auth` service.
 *
 * Connections:
 *   User Interaction -> SIGNUP.TS -> AuthService -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/apiService/api-service';
import { Auth } from '../../services/authService/auth-service';
import { TimeSlotUtil, GeneratedSlot } from '../../utils/timeSlot';
import {
  joiningDateValidator,
  getMinDate,
  getMaxDate
} from '../../utils/joiningDateValidator';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup implements OnInit {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(ApiService);
  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  private readonly phonePattern = /^(\+91[\s-]?)?[6789]\d{9}$/;

  signupForm: FormGroup;
  roles: { value: string, label: string }[] = [];
  medicalRoles: string[] = [];
  rowSubSlotsMap: { [uniqueId: string]: GeneratedSlot[] } = {};
  departments: string[] = [];

  availableHours: string[] = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  errorMessage: string | null = null;
  isSubmitting = false;

  constructor() {
    this.signupForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
        confirmPassword: ['', Validators.required],
        role: ['', Validators.required],
        status: ['ACTIVE', Validators.required],
        medicalRegistrationNo: [''],
        phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
        qualification: ['', Validators.required],
        specialization: [''],
        consultationFee: [null],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        joiningDate: ['', [Validators.required, joiningDateValidator]],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: [this.passwordMatchValidator, this.doctorSlotValidator]

      },
    );

    this.signupForm.get('role')?.valueChanges.subscribe((role) => {
      this.updateMedicalValidators(role);
    });
  }

  ngOnInit(): void {
    this.fetchRoles();
    this.fetchDepartments();
  }

  fetchDepartments() {
    this.apiService.getAllDepartments().subscribe({
      next: (res: any) => {
        this.departments = (res.data || [])
          .map((d: any) => d.departmentName)
          .filter((name: string) => name.toUpperCase() !== 'ADMIN');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load departments', err);
        this.errorMessage = 'Could not load departments for registration.';
        this.cdr.markForCheck();
      },
    });
  }

  fetchRoles() {
    this.apiService.getPublicRoles().subscribe({
      next: (res: any) => {
        const allRoles = res.data || [];
        // Filter out roles that shouldn't be available for self-registration
        const allowedRoles = allRoles.filter((r: any) =>
          !['ADMIN', 'OWNER', 'PATIENT', 'SUPER_ADMIN'].includes(r.roleName.toUpperCase())
        );

        this.roles = allowedRoles.map((r: any) => ({
          value: r.roleName.toUpperCase(),
          label: this.formatRoleLabel(r.roleName)
        }));

        this.medicalRoles = allRoles
          .filter((r: any) => r.isMedicalRole)
          .map((r: any) => r.roleName.toUpperCase());

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load roles', err);
        this.errorMessage = 'Could not load roles for registration.';
        this.cdr.markForCheck();
      }
    });
  }

  formatRoleLabel(roleName: string): string {
    if (!roleName) return '';
    return roleName.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  doctorSlotValidator = (group: AbstractControl): ValidationErrors | null => {
    const role = group.get('role')?.value?.toLowerCase();
    const slots = group.get('availabilitySlots') as FormArray;

    if (role === 'doctor' && slots.length === 0) {
      return { noSlots: true };
    }
    return null;
  };

  minDate = getMinDate();
  maxDate = getMaxDate();

  passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  };

  get isMedicalRole(): boolean {
    const role = this.signupForm.get('role')?.value?.toUpperCase();
    return this.medicalRoles.includes(role);
  }

  get isDoctor(): boolean {
    return this.signupForm.get('role')?.value?.toUpperCase() === 'DOCTOR';
  }

  get availabilitySlots(): FormArray {
    return this.signupForm.get('availabilitySlots') as FormArray;
  }

  getCheckedSlotsArray(index: number): FormArray {
    return this.availabilitySlots.at(index).get('checkedSlots') as FormArray;
  }

  addSlot() {
    const uniqueId = 'slot_' + Date.now() + Math.random().toString(36).substring(2, 7);

    const slotGroup = this.fb.group({
      id: [uniqueId],
      dayOfWeek: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      checkedSlots: this.fb.array([]),
    });

    slotGroup.valueChanges.subscribe((changes) => {
      this.generateHourlySlots(uniqueId, slotGroup, changes.startTime ?? '', changes.endTime ?? '');
    });

    this.availabilitySlots.push(slotGroup);
    this.rowSubSlotsMap[uniqueId] = [];
  }

  removeSlot(index: number) {
    const slotGroup = this.availabilitySlots.at(index) as FormGroup;
    const uniqueId = slotGroup.get('id')?.value;

    this.availabilitySlots.removeAt(index);
    if (uniqueId) {
      delete this.rowSubSlotsMap[uniqueId];
    }
  }

  generateHourlySlots(uniqueId: string, slotGroup: FormGroup, start: string, end: string) {
    TimeSlotUtil.populateHalfHourSlots(uniqueId, slotGroup, start, end, this.rowSubSlotsMap);
  }

  updateMedicalValidators(role: string) {
    const commonMedicalFields = ['medicalRegistrationNo', 'specialization', 'qualification'];

    if (this.medicalRoles.includes(role?.toUpperCase())) {
      commonMedicalFields.forEach((field) => {
        this.signupForm.get(field)?.setValidators([Validators.required]);
      });

      if (role?.toUpperCase() === 'DOCTOR') {
        this.signupForm
          .get('consultationFee')
          ?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        this.signupForm.get('consultationFee')?.clearValidators();
      }

      if (this.availabilitySlots.length === 0) {
        this.addSlot();
      }
    } else {
      commonMedicalFields.forEach((field) => this.signupForm.get(field)?.clearValidators());
      this.signupForm.get('consultationFee')?.clearValidators();

      while (this.availabilitySlots.length !== 0) {
        this.removeSlot(0);
      }
    }

    commonMedicalFields.forEach((field) => this.signupForm.get(field)?.updateValueAndValidity());
    this.signupForm.get('consultationFee')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;
      this.cdr.markForCheck();

      const rawValues = this.signupForm.value;

      const rawQual = rawValues.qualification;
      const parsedQualifications =
        rawQual && typeof rawQual === 'string' && rawQual.trim() !== ''
          ? rawQual
            .split(',')
            .map((q: string) => q.trim())
            .filter((q: string) => q !== '')
          : [];

      const weeklyScheduleMap: { [day: string]: any[] } = {};

      (rawValues.availabilitySlots || []).forEach((slot: any) => {
        if (!slot.dayOfWeek) return;
        const uniqueId = slot.id;
        const structuralMap = this.rowSubSlotsMap[uniqueId] || [];
        const checkedBools = slot.checkedSlots || [];
        const day = slot.dayOfWeek;

        if (!weeklyScheduleMap[day]) {
          weeklyScheduleMap[day] = [];
        }

        structuralMap.forEach((item, subIdx) => {
          if (checkedBools[subIdx] === true) {
            weeklyScheduleMap[day].push({
              startTime: item.startTime,
              endTime: item.endTime,
            });
          }
        });
      });

      const formattedWeeklySchedule = Object.keys(weeklyScheduleMap).map(day => ({
        dayOfWeek: day,
        slots: weeklyScheduleMap[day]
      }));

      const payload = {
        ...rawValues,
        role: rawValues.role.toUpperCase(),
        department: rawValues.department.toUpperCase(),
        qualification: parsedQualifications,
        consultationFee: this.isDoctor ? Number(rawValues.consultationFee) : undefined,
        weeklySchedule: this.isDoctor ? formattedWeeklySchedule : [],
      };

      delete payload.availabilitySlots;

      this.auth.signup(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Backend Signup Error:', error);

          if (error.status === 422 && error.error?.errors) {
            this.errorMessage = error.error.errors
              .map((e: any) => `${e.param || e.path}: ${e.msg}`)
              .join(' | ');
          } else {
            this.errorMessage = error.error?.message || 'Server validation error occurred.';
          }
          this.cdr.markForCheck();
        },
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}
