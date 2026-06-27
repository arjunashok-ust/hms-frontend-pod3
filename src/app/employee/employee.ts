import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PermissionService } from '../services/permission';
import { PERMISSIONS } from '../constants/permissions';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective, Pagination],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})

export class Employee implements OnInit {
  
  readonly PERMISSIONS = PERMISSIONS;

  isEditMode = false;
  selectedEmployeeId = '';
  /* EMPLOYEE TABLE */

  employeeData: any[] = [];

  filteredEmployeeData: any[] = [];

  departments: string[] = [];

  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;
  hasPrevPage = false;
  loading = false;

  /* FILTERS */

  selectedText = '';

  selectedDepartment = '';

  selectedStatus = '';
  showModal = false;
  /* ALERTS */
  errorMessage = '';
  successMessage = '';
  /* SLOT DATA */
  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];
  /* FORM */

  employeeForm: any = {
    email: '',

    name: '',

    role: '',

    phone: '',

    department: '',

    designation: '',

    status: true,

    joiningDate: '',

    specialization: '',

    medicalRegistrationNo: '',

    qualification: '',

    consultationFee: '',

    startHour: '',

    endHour: '',

    availabilitySlots: [],
  };

  constructor(
    readonly auth: Auth,
    readonly cd: ChangeDetectorRef,
    readonly permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    if (globalThis.window) {
      const token = localStorage.getItem('token');
      console.log(token);

      if (token) {
        this.loadEmployees();
      }
    }
  }

  isProtectedRole(role: string): boolean {
    return role === 'admin' || role === 'super_admin';
  }

  get canManageAdmins(): boolean {
    return this.permissionService.has(PERMISSIONS.MANAGE_ADMIN);
  }

  canEditEmployee(employee: any): boolean {
    if (!this.permissionService.has(PERMISSIONS.EDIT_EMPLOYEE)) {
      return false;
    }
    if (this.isProtectedRole(employee.role)) {
      return this.canManageAdmins;
    }
    return true;
  }

  canDeleteEmployee(employee: any): boolean {
    if (!this.permissionService.has(PERMISSIONS.DELETE_EMPLOYEE)) {
      return false;
    }
    if (this.isProtectedRole(employee.role)) {
      return this.canManageAdmins;
    }
    return true;
  }

  /* LOAD EMPLOYEES */

  loadEmployees() {
    console.log(localStorage.getItem('token'));

    this.loading = true;
    this.auth.getEmployees({ page: this.currentPage, limit: 5 }).subscribe({
      next: (response: any) => {
        console.log(response.data[0]);
        this.employeeData = response.data || [];
        this.filteredEmployeeData = response.data || [];
        this.departments = Array.from(
          new Set(this.employeeData.map((emp: any) => String(emp.department))),
        );
        this.totalPages = response.meta?.totalPages || 1;
        this.hasNextPage = response.meta?.hasNextPage || false;
        this.hasPrevPage = response.meta?.hasPrevPage || false;
        this.loading = false;
        this.cd.detectChanges();
      },

      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    /* Ignore clicks while a page request is in flight (dup-request + race guard). */
    if (this.loading) return;
    this.currentPage = page;
    this.loadEmployees();
  }

  /* FILTERS */

  applyFilters() {
    this.filteredEmployeeData = this.employeeData.filter((employee: any) => {
      const searchMatch =
        employee.name?.toLowerCase().includes(this.selectedText.toLowerCase()) ||
        employee.email?.toLowerCase().includes(this.selectedText.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(this.selectedText.toLowerCase());

      const departmentMatch =!this.selectedDepartment || employee.department === this.selectedDepartment;
      const statusMatch = !this.selectedStatus || String(employee.status) === this.selectedStatus;
      return searchMatch && departmentMatch && statusMatch;
    });
  }

  /* OPEN MODAL */

  openModal() {
    this.isEditMode = false;
    this.selectedEmployeeId = '';
    this.showModal = true;
  }

  /* CLOSE MODAL */

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedEmployeeId = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  /* GENERATE TIME SLOTS */

  generateTimeSlots() {
    this.errorMessage = '';
    const startHour = Number(this.employeeForm.startHour);
    const endHour = Number(this.employeeForm.endHour);
    if (startHour >= endHour) {
      this.errorMessage = 'Start hour must be less than end hour';
      return;
    }

    this.generatedSlots = [];

    for (let i = startHour; i < endHour; i++) {
      this.generatedSlots.push(
        `${this.formatHour(i)} - ${this.formatHourHalf(i)}`,
        `${this.formatHourHalf(i)} - ${this.formatHour(i + 1)}`,
      );
    }
  }

  /* TOGGLE SLOT */

  toggleSlot(slot: string) {
    const existingIndex = this.employeeForm.availabilitySlots.indexOf(slot);

    if (existingIndex > -1) {
      this.employeeForm.availabilitySlots.splice(existingIndex, 1);
    } else {
      this.employeeForm.availabilitySlots.push(slot);
    }
  }

  /* CHECK SLOT */

  isSlotSelected(slot: string) {
    return this.employeeForm.availabilitySlots.includes(slot);
  }

  /* FORMAT FULL HOUR */

  formatHour(hour: number) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:00 ${period}`;
  }

  /* FORMAT HALF HOUR */

  formatHourHalf(hour: number) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:30 ${period}`;
  }

  /* ADD EMPLOYEE */
  addEmployee(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    /* ===========================
     UPDATE EMPLOYEE
     =========================== */

    if (this.isEditMode) {
      this.auth.updateEmployee(this.selectedEmployeeId, this.employeeForm).subscribe({
        next: (response: any) => {
          console.log(response);

          this.successMessage = response.message;

          this.loadEmployees();

          setTimeout(() => {
            this.closeModal();
          }, 1000);
        },

        error: (err: any) => {
          console.log(err);

          this.errorMessage = err?.error?.message || 'Unable To Update Employee';
        },
      });

      return;
    }

    /* ===========================
     CREATE EMPLOYEE
     =========================== */

    console.log(this.employeeForm);

    this.auth.adminSignup(this.employeeForm).subscribe({
      next: (response: any) => {
        console.log(response);

        this.successMessage = response.message;

        this.loadEmployees();

        form.resetForm();

        this.employeeForm = {
          email: '',

          name: '',

          role: '',

          phone: '',

          department: '',

          designation: '',

          status: true,

          joiningDate: '',

          specialization: '',

          medicalRegistrationNo: '',

          qualification: '',

          consultationFee: '',

          startHour: '',

          endHour: '',

          availabilitySlots: [],
        };

        this.generatedSlots = [];

        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },

      error: (err: any) => {
        console.log(err);

        if (err?.error?.errors) {
          this.errorMessage = err.error.errors.map((e: any) => e.msg).join(', ');
        } else {
          this.errorMessage = err?.error?.message || 'Unable To Create Employee';
        }
      },
    });
  }

  /* DELETE EMPLOYEE */

  deleteEmployee(employeeId: string) {
    this.auth.deleteEmployee(employeeId).subscribe({
      next: (response: any) => {
        alert('Employee Deleted Successfully');

        this.loadEmployees();
      },

      error: (err: any) => {
        console.log(err);

        alert('Unable To Delete Employee');
      },
    });
  }

  /* EDIT EMPLOYEE */

  editEmployee(employee: any) {
    // ONLY USERS WITH EDIT_EMPLOYEE PERMISSION

    if (!this.permissionService.has(PERMISSIONS.EDIT_EMPLOYEE)) {
      return;
    }

    this.isEditMode = true;

    this.selectedEmployeeId = employee.employeeId;

    this.employeeForm = {
      email: employee.email,

      name: employee.name,

      role: employee.role,

      phone: employee.phone,

      department: employee.department,

      designation: employee.designation,

      status: employee.status,

      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',

      specialization: employee.specialization || '',

      medicalRegistrationNo: employee.medicalRegistrationNo || '',

      qualification: employee.qualification || '',

      consultationFee: employee.consultationFee || '',

      availabilitySlots: employee.availabilitySlots || [],

      startHour: '',

      endHour: '',
    };

    this.showModal = true;
  }
}
