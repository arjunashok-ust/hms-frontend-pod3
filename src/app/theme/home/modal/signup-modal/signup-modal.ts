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
import { DepartmentModel, RoleModel, SpecializationModel } from '../../../../models/ui.model';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { mapToSignUpRequest } from '../../../mapper/mapToSignUpRequest';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup-modal',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './signup-modal.html',
  styleUrl: './signup-modal.css',
})
export class SignUpModalComponent implements OnInit {
  signUpModalForm: FormGroup;
  auth: AuthService = inject(AuthService);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  router: Router = inject(Router);

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  ngOnInit(): void {
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
    this.signUpModalForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.required]],
      role: ['', [Validators.required]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      status: ['Active'],
      joiningDate: ['', Validators.required],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: [''],
      consultationFee: [''],
      startHour: [''],
      endHour: [''],
      availabilitySlots: this.fb.array([]),
      selectedRoles: this.fb.array([]),
    });
  }

  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = Number(this.signUpModalForm.get('startHour')?.value);
    let endHour = Number(this.signUpModalForm.get('endHour')?.value);

    if (startHour == null || endHour == null || startHour >= endHour) {
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
    const arr = this.signUpModalForm.get('availabilitySlots') as FormArray;
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
    const payload = mapToSignUpRequest(this.signUpModalForm);
    this.auth.signUp(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.router.navigate(['/employee']);
      },
      error: (error) => {
        this.toast.error(error.message);
      },
    });
  }
}
