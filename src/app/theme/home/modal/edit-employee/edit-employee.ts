import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { UserEmployeeModel } from '../../../../models/user.model';
import { AdminService } from '../../../../services/admin.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DepartmentModel, RoleModel, SpecializationModel } from '../../../../models/ui.model';
import { AuthService } from '../../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-employee',
  imports: [RouterLink, RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-employee.html',
  styleUrl: './edit-employee.css',
})
export class EditEmployeeComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  updateForm: FormGroup;

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  users: UserEmployeeModel[] | null = null;
  userData: UserEmployeeModel | null = null;

  public constructor(readonly fb: FormBuilder) {
    this.updateForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
      email: [
        '',
        [
          Validators.email,
          Validators.required,
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
      qualification: ['', [Validators.pattern(/^[a-z ]*$/i)]],
      consultationFee: [''],
      startHour: [''],
      endHour: [''],
      availabilitySlots: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    const userEmail = localStorage.getItem('updateEmail') ?? '';
    this.adminService.getUserEmployee().subscribe({
      next: (res) => {
        console.log(res);
        this.users = res;
        this.userData = this.users.find((emp) => emp.email === userEmail) || null;
        this.updateForm.patchValue({
          name: this.userData?.name,
          email: this.userData?.email,
          role: this.userData?.role,
          department: this.userData?.department,
          designation: this.userData?.designation,
          joiningDate: this.userData?.joiningDate
            ? this.userData.joiningDate.toString().split('T')[0]
            : '',
          medicalRegistrationNo: this.userData?.medicalRegistrationNo,
          specialization: this.userData?.specialization,
          qualification: this.userData?.qualification,
          consultationFee: this.userData?.consultationFee,
          availabilitySlots: this.userData?.availabilitySlots,
        });
        this.cd.detectChanges();
      },
    });
    this.authService.getUiData<RoleModel[]>('/ui/getRoles').subscribe((res) => {
      this.roles_data = res;
      this.cd.detectChanges();
    });
    this.authService.getUiData<DepartmentModel[]>('/ui/getDepartments').subscribe((res) => {
      this.departments_data = res;
      this.cd.detectChanges();
    });
    this.authService.getUiData<SpecializationModel[]>('/ui/getSpecializations').subscribe((res) => {
      this.specializations_data = res;
      this.cd.detectChanges();
    });
  }

  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = Number(this.updateForm.get('startHour')?.value);
    let endHour = Number(this.updateForm.get('endHour')?.value);

    if (startHour == null || endHour == null || startHour >= endHour) {
      return;
    }

    if (this.userData?.availabilitySlots) {
      this.generatedSlots.push(...(this.userData?.availabilitySlots || []));
    }

    for (let i = startHour; i < endHour; i++) {
      this.generatedSlots.push(
        `${this.format(i)} : 00 - ${this.format(i)} : 30`,
        `${this.format(i)} : 30 - ${this.format(i + 1)} : 00`,
      );
    }
  }

  toggleSlot(slot: string) {
    const arr = this.updateForm.get('availabilitySlots') as FormArray;
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
    const payload = {
      employeeId: this.userData?.employeeId,
      data: {
        name: this.updateForm.get('name')?.value,
        role: this.updateForm.get('role')?.value,
        department: this.updateForm.get('department')?.value,
        status: this.updateForm.get('status')?.value,
        joiningDate: this.updateForm.get('joiningDate')?.value,
        medicalRegistrationNo: this.updateForm.get('medicalRegistrationNo')?.value,
        specialization: this.updateForm.get('specialization')?.value,
        qualification: this.updateForm.get('qualification')?.value,
        availabilitySlots: this.updateForm.get('availabilitySlots')?.value,
        consultationFee: this.updateForm.get('consultationFee')?.value,
      },
    };
    this.adminService.updateUserProfile(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.router.navigate(['/employee']);
      },
      error: (error) => {
        this.toast.error('Server error during update user profile');
      },
    });
  }
}
