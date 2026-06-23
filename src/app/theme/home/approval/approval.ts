import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { UserEmployeeModel, UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-approval',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalComponent implements OnInit {
  adminService: AdminService = inject(AdminService);

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);
  route: Router = inject(Router);

  userData: UserEmployeeModel[] = [];

  page: number = 1;
  limit: number = 5;
  totalPages: number = 1;

  approvalUiData = {
    activeCount: 0,
    inactiveCount: 0,
    verifiedCount: 0,
    pendingApprovalCount: 0,
    pendingVerifyCount: 0,
    pendingFirstLoginCount: 0,
  };

  searchText = '';

  ngOnInit(): void {
    this.fetchUsersData();
    this.loadUiData();
  }

  fetchUsersData() {
    this.adminService.getUserEmployee(this.searchText, this.page, this.limit).subscribe({
      next: (res) => {
        this.userData = res.data as UserEmployeeModel[];
        this.totalPages = res.totalPages;
        this.loadUiData();
        this.cd.detectChanges();
      },
      error: (error) => {
        this.toast.error(error?.error?.message);
      },
    });
  }

  loadUiData() {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.approvalUiData = res as any;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });
  }

  normalize(text: string) {
    return (text || '').trim().toLowerCase();
  }

  approveUser(id: string) {
    const payload = { employeeId: id };

    this.adminService.approveUser(payload).subscribe({
      next: (res) => {
        this.userData = this.userData.map((user) =>
          user.employeeId === id ? { ...user, status: 'Active' } : user,
        );

        this.fetchUsersData();

        this.cd.detectChanges();
        this.toast.success(res.message || 'Account Activated.');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }

  rejectUser(id: string) {
    const payload = { employeeId: id };
    this.adminService.rejectUser(payload).subscribe({
      next: (res) => {
        this.userData = this.userData.map((user) =>
          user.employeeId === id ? { ...user, status: 'Inactive' } : user,
        );

        this.fetchUsersData();
        this.cd.detectChanges();

        this.toast.success(res?.message || 'Application Rejected!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
    }
    this.fetchUsersData();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
    }
    this.fetchUsersData();
  }

  goToPage(index: number) {
    this.page = index;
    this.fetchUsersData();
  }

  trackFn(index: number,item: UserModel){
    return item.employeeId;
  }
}
