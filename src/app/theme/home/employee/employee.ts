import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { EmployeeModel } from '../../../models/user.model';
import { DepartmentModel } from '../../../models/ui.model';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from "@angular/router";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-employee',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class EmployeeComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  employeeData: EmployeeModel[] = [];
  departmentsData: DepartmentModel[] = [];
  filteredEmployeeData: EmployeeModel[] = [];

  selectedText = '';
  selectedDepartment = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.employeeData = res;
        this.applyFilters();
        this.cd.detectChanges();
      },
      error: () => this.toast.error('Error fetching employees'),
    });

    this.authService.getUiData<DepartmentModel[]>('/ui/getdepartments').subscribe({
      next: (res) => this.departmentsData = res,
    });
  }

  applyFilters(): void {
    this.filteredEmployeeData = this.employeeData.filter(emp => {
      const search = this.selectedText.toLowerCase();

      const searchMatch =
        emp.name.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.employeeId.toLowerCase().includes(search);

      const deptMatch =
        !this.selectedDepartment || emp.department === this.selectedDepartment;

      const statusMatch =
        !this.selectedStatus || emp.status === this.selectedStatus;

      return searchMatch && deptMatch && statusMatch;
    });
  }

  updateProfile(email: string): void {
    localStorage.setItem('updateEmail', email);
    this.router.navigate(['/edit-employee']);
  }

  deleteUserProfile(employeeId: string): void {
    this.adminService.deleteUserProfile({ employeeId }).subscribe({
      next: () => {
        this.toast.success('Deleted successfully');
        this.employeeData = this.employeeData.filter(emp => emp.employeeId !== employeeId);
        this.applyFilters();
      },
      error: () => this.toast.error('Delete failed'),
    });
  }
}