import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { timeRangeValidator } from '../validators/time-range-validator';
import { AuthService } from '../service/auth/auth.service';
import { DepartmentModel, RoleModel, SpecializationModel } from '../models/auth/auth.model';
import { mapToSignUpRequest } from '../mapper/mapToSignUpRequest';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.htm',
  styleUrl: './signup.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class SignUpComponent implements OnInit {
  signUpForm: FormGroup;
  auth: AuthService = inject(AuthService);
  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];
  route : Router = inject(Router);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit() {
    this.auth.getUiData<RoleModel[]>('/auth/getRoles').subscribe((res) => {
      this.roles_data = res;
      this.cd.detectChanges();
    });
    this.auth.getUiData<DepartmentModel[]>('/auth/getDepartments').subscribe((res) => {
      this.departments_data = res;
      this.cd.detectChanges();
    });
    this.auth.getUiData<SpecializationModel[]>('/auth/getSpecializations').subscribe((res) => {
      this.specializations_data = res;
      this.cd.detectChanges();
    });
  }

  public constructor(readonly fb: FormBuilder) {
    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.email, Validators.required]],
        roles: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['', Validators.required],
        joiningDate: ['', Validators.required],
        medicalRegistrationNo: [''],
        specialization: [''],
        qualification: ['', [Validators.required]],
        consultationFee: [''],
        startHour: [''],
        endHour: [''],
        availabilitySlots: this.fb.array([]),
        selectedRoles: this.fb.array([]),
      },
      {
        validators: timeRangeValidator,
      },
    );
  }

  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = Number(this.signUpForm.get('startHour')?.value);
    let endHour = Number(this.signUpForm.get('endHour')?.value);

    if (!startHour || !endHour) {
      return;
    }

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

  toggleRole(role: string) {
    console.log(role);
    const arr = this.signUpForm.get('selectedRoles') as FormArray;
    if (arr.value.includes(role)) {
      const index = arr.value.indexOf(role);
      arr.removeAt(index);
    } else {
      arr.push(this.fb.control(role));
    }
  }

  // Formatting
  format(i: number) {
    return i.toString().padStart(2, '0');
  }

  onSubmit() {
    console.log(this.signUpForm.value);
    const payload = mapToSignUpRequest(this.signUpForm);
    console.log(payload);
    this.auth.signUp(payload).subscribe({
      next: (res) => {
        console.log(res);
        alert(res.message);
        this.route.navigate(['/login']);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
}
