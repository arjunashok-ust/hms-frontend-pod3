import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { timeRangeValidator } from '../../validators/time-range-validator';
import { AuthService } from '../../services/auth.service';
import { DepartmentModel, RoleModel, SpecializationModel } from '../../models/ui.model';
import { mapToSignUpRequest } from '../mapper/mapToSignUpRequest';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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
  route: Router = inject(Router);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];
  
  ngOnInit() {
    this.auth.getUiData<RoleModel[]>('/ui/getRoles').subscribe((res) => {
      this.roles_data = res;
      this.cd.detectChanges();
    });
    this.auth.getUiData<DepartmentModel[]>('/ui/getDepartments').subscribe((res) => {
      this.departments_data = res;
      this.cd.detectChanges();
    });
    this.auth.getUiData<SpecializationModel[]>('/ui/getSpecializations').subscribe((res) => {
      this.specializations_data = res;
      this.cd.detectChanges();
    });
  }

  public constructor(readonly fb: FormBuilder) {
    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.email, Validators.required]],
        role: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['Pending'],
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

    if(startHour == null || endHour == null || startHour>=endHour){
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
    const payload = mapToSignUpRequest(this.signUpForm);
    this.auth.signUp(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.route.navigate(['/login']);
      },
      error: (error) => {
        console.log(error);
        this.toast.error("Server error during login");
      },
    });
  }
}
