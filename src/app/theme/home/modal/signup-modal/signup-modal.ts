import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DepartmentModel, RoleModel, SpecializationModel } from '../../../../models/ui.model';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { mapToSignUpRequest } from '../../../mapper/mapToSignUpRequest';
import { ToastrService } from 'ngx-toastr';
import { futureDateValidator, timeRangeValidator } from '../../../../validators/time-range-validator';

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './signup-modal.html',
  styleUrl: './signup-modal.css',
})
export class SignUpModalComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastrService);
  private router = inject(Router);

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  signUpModalForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      status: ['Active'],
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
      validators: [timeRangeValidator, futureDateValidator],
    }
  );

  hours = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];

  ngOnInit(): void {
    this.auth.getUiData<RoleModel[]>('/ui/getRoles')
      .subscribe(res => this.roles_data = res);

    this.auth.getUiData<DepartmentModel[]>('/ui/getDepartments')
      .subscribe(res => this.departments_data = res);

    this.auth.getUiData<SpecializationModel[]>('/ui/getSpecializations')
      .subscribe(res => this.specializations_data = res);
  }

  generateTimeSlots(): void {
    const start = Number(this.signUpModalForm.get('startHour')?.value);
    const end = Number(this.signUpModalForm.get('endHour')?.value);

    if (start >= end) return;
    this.generatedSlots = [];

    for (let i = start; i < end; i++) {
      this.generatedSlots.push(
        `${this.format(i)}:00 - ${this.format(i)}:30`,
        `${this.format(i)}:30 - ${this.format(i + 1)}:00`
      );
    }
  }

  toggleSlot(slot: string): void {
    const arr = this.signUpModalForm.get('availabilitySlots') as FormArray;
    const index = arr.value.indexOf(slot);

    if (index > -1) {
      arr.removeAt(index);
    } else {
      arr.push(this.fb.control(slot));
    }
  }
  format(i: number): string {
    return i.toString().padStart(2, '0');
  }

  onSubmit(): void {
    if (this.signUpModalForm.invalid) {
      this.toast.error('Please fill required fields');
      return;
    }

    const payload = mapToSignUpRequest(this.signUpModalForm);
    this.auth.signUp(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.router.navigate(['/employee']);
      },
      error: (error) => {
        this.toast.error(error.message || 'Signup failed');
      },
    });
  }
}
