import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
  templateUrl: './signup.htm',
  styleUrl: './signup.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;
  auth: AuthService = inject(AuthService);
  route: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);

  roles_data = signal<RoleModel[]>([]);
  departments_data = signal<DepartmentModel[]>([]);
  specializations_data = signal<SpecializationModel[]>([]);

  isLoading = signal(false);

  ngOnInit() {
    this.auth.getUiData<RoleModel[]>('/ui/getRoles').subscribe((res) => {
      this.roles_data.set(res);
    });
    this.auth.getUiData<DepartmentModel[]>('/ui/getDepartments').subscribe((res) => {
      this.departments_data.set(res);
    });
    this.auth.getUiData<SpecializationModel[]>('/ui/getSpecializations').subscribe((res) => {
      this.specializations_data.set(res);
    });
    
    this.signUpForm.get('role')?.valueChanges.subscribe(() => {
      this.generatedSlots = [];

      (this.signUpForm.get('availabilitySlots') as FormArray).clear();

      this.signUpForm.patchValue({
        department: '',
        designation: '',
        joiningDate: '',
        medicalRegistrationNo: '',
        specialization: '',
        qualification: '',
        consultationFee: '',
        startHour: '',
        endHour: '',
      });
    });
  }

  public constructor(readonly fb: FormBuilder) {
    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        email: [
          '',
          [Validators.required, Validators.pattern(/^[a-z0-9._]+@[a-z0-9]*\.[a-z]{2,}$/i)],
        ],
        role: ['', [Validators.required]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', Validators.required],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['Pending'],
        joiningDate: ['', Validators.required],
        medicalRegistrationNo: ['', Validators.pattern(/^[a-z0-9]*$/i)],
        specialization: [''],
        qualification: ['', [Validators.pattern(/^[a-z]+([ -][a-z]+)*$/i), Validators.required]],
        consultationFee: [''],
        startHour: [''],
        endHour: [''],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: [timeRangeValidator, futureDateValidator, passwordsMatchValidator],
      },
    );
  }

  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = this.signUpForm.get('startHour')?.value;
    let endHour = this.signUpForm.get('endHour')?.value;

    if (!startHour || !endHour) {
      return;
    }

    startHour = Number(startHour);
    endHour = Number(endHour);

    if (startHour >= endHour) {
      return;
    }

    this.generatedSlots = [];

    for (let i = startHour; i < endHour; i++) {
      this.generatedSlots.push(
        `${this.format(i)} : 00 - ${this.format(i)} : 30`,
        `${this.format(i)} : 30 - ${this.format(i + 1)} : 00`,
      );
    }
  }

  toggleSlot(slot: string) {
    const arr = this.signUpForm.get('availabilitySlots') as FormArray;
    if (arr.value.includes(slot)) {
      const index = arr.value.indexOf(slot);
      arr.removeAt(index);
    } else {
      arr.push(this.fb.control(slot));
    }
  }

  // Formatting
  format(i: number) {
    return i.toString().padStart(2, '0');
  }

  onSubmit() {
    if (!this.signUpForm.valid) {
      this.toast.warning('Validation failed,please check the fields');
      this.signUpForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const payload = mapToSignUpRequest(this.signUpForm);
    this.auth.signUp(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.success(res.message);
        this.route.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
