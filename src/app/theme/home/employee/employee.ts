import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { EmployeeModel } from '../../../models/user.model';
import { DepartmentModel } from '../../../models/ui.model';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-employee',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  page: number = 1;
  totalPages: number = 1;
  limit: number = 5;

  employeeData: EmployeeModel[] = [];
  departmentsData: DepartmentModel[] = [];

  selectedText: string = '';
  selectedDepartment: string = '';

  ngOnInit(): void {
    this.fetchEmployees();
    this.authService.getUiData<DepartmentModel[]>('/ui/getDepartments').subscribe({
      next: (res) => {
        this.departmentsData = res;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error getting departments data');
      },
    });
  }

  fetchEmployees() {
    this.adminService
      .getEmployees(this.selectedText, this.selectedDepartment, this.page, this.limit)
      .subscribe({
        next: (res) => {
          if(res.data.length == 0) return;
          this.employeeData = res.data;
          this.totalPages = res.totalPages;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Error getting employees data');
        },
      });
  }

  // saving email to use it in the update profile
  updateProfile(email: string) {
    localStorage.setItem('updateEmail', email);
    this.router.navigate(['/edit-employee']);
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
    this.fetchEmployees();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
    this.fetchEmployees();
  }

  goToPage(index: number) {
    this.page = index;
    this.fetchEmployees();
  }

  deleteUserProfile(employeeId: string) {
    const isConfirmed = confirm(
      `Are you sure you want to remove user ${employeeId}? This action cannot be undone.`,
    );

    if (isConfirmed) {
      const payload = { employeeId: employeeId };

      this.adminService.deleteUserProfile(payload).subscribe({
        next: (res) => {
          this.employeeData = this.employeeData.filter(
            (employee) => employee.employeeCode !== employeeId,
          );
          this.cd.detectChanges();
          this.toast.success(res?.message || 'Account deleted successfully');
        },
        error: (err) => {
          this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
        },
      });
    }
  }

  trackFn(index: number,item: EmployeeModel){
    return item.employeeCode;
  }
}
