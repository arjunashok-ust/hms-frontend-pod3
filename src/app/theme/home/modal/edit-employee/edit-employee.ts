import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { EmployeeModel } from '../../../../models/user.model';
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
import {
  DepartmentModel,
  RoleModel,
  SpecializationModel,
} from '../../../../models/ui.model';
import { AuthService } from '../../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-employee',
  imports: [RouterLink, RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-employee.html',
  styleUrl: './edit-employee.css',
})
export class EditEmployeeComponent implements OnInit {

  adminService = inject(AdminService);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  updateForm: FormGroup;

  users: EmployeeModel[] = [];
  userData: EmployeeModel | null = null;

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  constructor(private fb: FormBuilder) {
    this.updateForm = this.fb.group({
      name: ['', Validators.required],
      email: [''],
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
    });
  }

  ngOnInit(): void {
    const userEmail = localStorage.getItem('updateEmail') || '';

    this.adminService.getEmployees().subscribe({
      next: (res: EmployeeModel[]) => {
        this.users = res;

        this.userData = this.users.find(
          emp => emp.email === userEmail
        ) || null;

        if (this.userData) {
          this.updateForm.patchValue({
            name: this.userData.name,
            email: this.userData.email,
            department: this.userData.department,
            designation: this.userData.designation,
            joiningDate: this.userData.joiningDate
              ? this.userData.joiningDate.split('T')[0]
              : '',
            medicalRegistrationNo: this.userData.medicalRegistrationNo,
            specialization: this.userData.specialization,
            qualification: this.userData.qualification,
            consultationFee: this.userData.consultationFee,
          });

          const slotArray = this.updateForm.get('availabilitySlots') as FormArray;
          this.userData.availabilitySlots?.forEach(slot => {
            slotArray.push(this.fb.control(slot));
          this.cd.detectChanges();
          });
        }
      },
      error: () => this.toast.error('Failed to load employee'),
    });

    this.authService.getUiData<RoleModel[]>('/ui/getRoles')
      .subscribe(res => this.roles_data = res);

    this.authService.getUiData<DepartmentModel[]>('/ui/getDepartments')
      .subscribe(res => this.departments_data = res);

    this.authService.getUiData<SpecializationModel[]>('/ui/getSpecializations')
      .subscribe(res => this.specializations_data = res);
  }

  hours = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];

  generateTimeSlots(): void {
    const start = Number(this.updateForm.get('startHour')?.value);
    const end = Number(this.updateForm.get('endHour')?.value);

    if (start >= end) {
      this.toast.error('Start hour must be less than end hour');
      return;
    }

    this.generatedSlots = [];

    for (let i = start; i < end; i++) {
      this.generatedSlots.push(
        `${this.format(i)}:00 - ${this.format(i)}:30`,
        `${this.format(i)}:30 - ${this.format(i + 1)}:00`
      );
    }
  }

  toggleSlot(slot: string): void {
    const arr = this.updateForm.get('availabilitySlots') as FormArray;
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
    if (this.updateForm.invalid) {
      this.toast.error('Invalid form');
      return;
    }

    const payload = {
      name: this.updateForm.get('name')?.value,
      email: this.updateForm.get('email')?.value,
      phone: '',
      consultationFee: this.updateForm.get('consultationFee')?.value,
      availabilitySlots: this.updateForm.get('availabilitySlots')?.value,
    };

    this.adminService.updateEmployee(payload).subscribe({
      next: () => {
        this.toast.success('Employee updated successfully');
        this.router.navigate(['/employee']);
      },
      error: () => {
        this.toast.error('Update failed');
      },
    });
  }
}