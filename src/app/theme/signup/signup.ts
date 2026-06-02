import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { timeRangeValidator, futureDateValidator } from '../../validators/time-range-validator';
import { AuthService } from '../../services/auth.service';
import { DepartmentModel, RoleModel, SpecializationModel } from '../../models/ui.model';
import { mapToSignUpRequest } from '../mapper/mapToSignUpRequest';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { passwordsMatchValidator } from '../../validators/password-match-validator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;

  authService = inject(AuthService);
  router = inject(Router);
  toastMsg = inject(ToastrService);

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  constructor(private fb: FormBuilder) {
    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['',[Validators.required]],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['INACTIVE'],
        joiningDate: ['', Validators.required],
        medicalRegistrationNo: ['', Validators.pattern(/^[a-z0-9]*$/i)],
        specialization: [''],
        qualification: ['', Validators.pattern(/^[a-z ]*$/i)],
        consultationFee: [''],
        startHour: [''],
        endHour: [''],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: [timeRangeValidator, futureDateValidator, passwordsMatchValidator],
      }
    );
  }

  ngOnInit(): void {
    this.authService.getUiData<RoleModel[]>('/ui/getroles').subscribe((res) => {
      this.roles_data = res;
    });

    this.authService.getUiData<DepartmentModel[]>('/ui/getdepartment').subscribe((res) => {
      this.departments_data = res;
    });

    this.authService.getUiData<SpecializationModel[]>('/ui/getspecialization').subscribe((res) => {
      this.specializations_data = res;
    });
  }

  hours = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];

  generateTimeSlots(): void {
    const start = Number(this.signUpForm.get('startHour')?.value);
    const end = Number(this.signUpForm.get('endHour')?.value);

    if (!start || !end || start >= end) return;

    this.generatedSlots = [];

    for (let i = start; i < end; i++) {
      this.generatedSlots.push(
        `${this.format(i)}:00 - ${this.format(i)}:30`,
        `${this.format(i)}:30 - ${this.format(i + 1)}:00`
      );
    }
  }

  toggleSlot(slot: string): void {
    const arr = this.signUpForm.get('availabilitySlots') as FormArray;

    if (arr.value.includes(slot)) {
      arr.removeAt(arr.value.indexOf(slot));
    } else {
      arr.push(this.fb.control(slot));
    }
  }

  format(value: number): string {
    return value.toString().padStart(2, '0');
  }

  onSubmit(): void {
    if (this.signUpForm.invalid) return;

    const payload = mapToSignUpRequest(this.signUpForm);

    this.authService.signUp(payload).subscribe({
      next: (res) => {
        this.toastMsg.success(res.message);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toastMsg.error('Signup failed');
      },
    });
  }
}