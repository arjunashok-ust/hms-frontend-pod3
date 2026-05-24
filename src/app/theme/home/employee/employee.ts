import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { EmployeeModel } from '../../../models/user.model';
import { DepartmentModel } from '../../../models/ui.model';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-employee',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class EmployeeComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  authService: AuthService = inject(AuthService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  employeeData: EmployeeModel[] = [];
  departmentsData: DepartmentModel[] = [];

  filteredEmployeeData: EmployeeModel[] = [];
  selectedText: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';

  ngOnInit(): void {
    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.employeeData = res;
        this.applyFilters();
        this.cd.detectChanges();
      },
      error: (err) => {
        alert('Error fetching data from server');
      },
    });
    this.authService.getUiData<DepartmentModel[]>('/ui/getDepartments').subscribe({
      next: (res) => {
        this.departmentsData = res;
      },
    });
  }

  applyFilters() {
    this.filteredEmployeeData = this.employeeData?.filter((employee) => {
      const searchMatch =
        employee.name.toLowerCase().includes(this.selectedText.toLowerCase()) ||
        employee.email.toLowerCase().includes(this.selectedText.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(this.selectedText.toLowerCase());
      const departmentMatch =
        !this.selectedDepartment || employee.department === this.selectedDepartment;
      const statusMatch = !this.selectedStatus || employee.status === this.selectedStatus;
      return searchMatch && departmentMatch && statusMatch;
    });
  }

  deleteUserProfile(employeeId: string) {
    const payload = { employeeId: employeeId };
    this.adminService.deleteUserProfile(payload).subscribe({
      next: (res) => {
        this.employeeData = this.employeeData.filter((employee)=>employee.employeeCode!==employeeId);
        this.applyFilters();
        this.cd.detectChanges();
        alert('Account Deleted Sucessfully');
      },
      error: (err) => {
        alert('Server Error During Delete User Profile');
      },
    });
  }
}
