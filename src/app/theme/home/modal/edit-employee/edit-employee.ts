import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { EmployeeModel, UserModel } from '../../../../models/user.model';
import { AdminService } from '../../../../services/admin.service';
import { UserService } from '../../../../services/user.service';
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

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  updateForm: FormGroup;

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];
  employee: EmployeeModel[] | null = null;
  userData: EmployeeModel | null = null;

  public constructor(readonly fb: FormBuilder) {
    this.updateForm = this.fb.group({
      name: [''],
      email: [''],
      role: [''],
      department: [''],
      designation: [''],
      status: [''],
      joiningDate: [''],
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

  ngOnInit(): void {
    const userEmail = localStorage.getItem('updateEmail') ?? '';
    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.employee = res;
        this.userData = this.employee.find((emp) => emp.email === userEmail) || null;

        this.updateForm.patchValue({
          name: this.userData?.name,
          email: this.userData?.email,
          role: this.userData?.designation,
          department: this.userData?.department,
          designation: this.userData?.designation,
          status: this.userData?.status,
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

    this.generatedSlots = [];

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
      employeeId: this.userData?.employeeCode,
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
      }
    };
    this.adminService.updateUserProfile(payload).subscribe({
      next: (res) => {
        alert(res.message);
        this.router.navigate(['/employee']);
      },
      error: (error) => {
        alert("Server error during update user profile");
      }
    });
  }
}
