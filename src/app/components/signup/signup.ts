import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
})
export class Signup {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  private readonly phonePattern = /^(\+91[\s-]?)?[6789]\d{9}$/;

  signupForm: FormGroup;
  medicalRoles = ['doctor', 'nurse', 'lab_tech', 'pharmacist'];
  rowSubSlotsMap: { [uniqueId: string]: GeneratedSlot[] } = {};
  departments = ["OPD", "IPD", "ADMIN", "LAB", "PHARMACY"];

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
        phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
        role: ['', Validators.required],
        status: ['ACTIVE', Validators.required],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        joiningDate: ['', [Validators.required, joiningDateValidator]],
        medicalRegistrationNo: [''],
        specialization: [''],
        qualification: ['', Validators.required],
        consultationFee: [null],
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
    const role = this.signupForm.get('role')?.value;
    return this.medicalRoles.includes(role);
  }

  get isDoctor(): boolean {
    return this.signupForm.get('role')?.value === 'doctor';
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

    if (this.medicalRoles.includes(role)) {
      commonMedicalFields.forEach((field) => {
        this.signupForm.get(field)?.setValidators([Validators.required]);
      });

      if (role === 'doctor') {
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
