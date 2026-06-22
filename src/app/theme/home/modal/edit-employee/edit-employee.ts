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
import {
  futureDateValidator,
  timeRangeValidator,
} from '../../../../validators/time-range-validator';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-edit-employee',
  imports: [RouterLink, RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-employee.html',
  styleUrl: './edit-employee.css',
})
export class EditEmployeeComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  userService: UserService = inject(UserService);
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);

  isLoading: boolean = false;

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  updateForm: FormGroup;

  roles_data: RoleModel[] = [];
  departments_data: DepartmentModel[] = [];
  specializations_data: SpecializationModel[] = [];

  users: UserEmployeeModel[] | null = null;
  userData: UserEmployeeModel | null = null;

  public constructor(readonly fb: FormBuilder) {
    this.updateForm = this.fb.group(
      {
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
        consultationFee: ['', [Validators.pattern(/^\d+$/)]],
        startHour: ['', [Validators.min(0)]],
        endHour: ['', [Validators.max(23)]],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: [timeRangeValidator, futureDateValidator],
      },
    );
  }

  ngOnInit(): void {
    const userEmail = localStorage.getItem('updateEmail') ?? '';

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

    this.userService.getSingleUser(userEmail).subscribe({
      next: (res) => {
        this.userData = res;
        console.log(res);
        this.updateForm.patchValue({
          name: res.name,
          email: res.email,
          role: res.role,
          department: res.department,
          designation: res.designation,
          joiningDate: res.joiningDate
            ? res.joiningDate.toString().split('T')[0]
            : '',
          medicalRegistrationNo: res.medicalRegistrationNo,
          specialization: res.specialization,
          qualification: res.qualification,
          consultationFee: res.consultationFee,
        });

        // availability slots patch
        const slotsArray = this.updateForm.get('availabilitySlots') as FormArray;
        slotsArray.clear();

        (this.userData?.availabilitySlots || []).forEach((slot) =>
          slotsArray.push(this.fb.control(slot)),
        );

        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });
  }

  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = this.updateForm.get('startHour')?.value;
    let endHour = this.updateForm.get('endHour')?.value;

    if (!startHour || !endHour) {
      return;
    }

    startHour = Number(startHour);
    endHour = Number(endHour);

    if (startHour >= endHour) {
      return;
    }

    this.generatedSlots = [];

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

    const index: number = arr.value.indexOf(slot);

    if (index === -1) {
      arr.push(this.fb.control(slot));
    } else {
      arr.removeAt(index);
    }
  }

  // Formatting
  format(i: number) {
    return i.toString().padStart(2, '0');
  }

  onSubmit() {
    if (this.updateForm.invalid) {
      this.toast.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    const payload = {
      employeeId: this.userData?.employeeId,
      data: {
        name: this.updateForm.get('name')?.value,
        email: this.userData?.email,
        designation: this.updateForm.get('designation')?.value,
        role: this.userData?.role,
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
        this.isLoading = false;
        this.toast.success(res.message);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
