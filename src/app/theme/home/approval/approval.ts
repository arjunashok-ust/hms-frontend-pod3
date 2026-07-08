import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { UserEmployeeModel, UserModel } from '../../../models/user.model';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';

@Component({
  selector: 'app-approval',
  imports: [RouterModule, CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  toast: ToastrService = inject(ToastrService);

  userData = signal<UserEmployeeModel[]>([]);

  page = signal(1);
  limit = signal(5);
  totalPages = signal(1);

  approvalUiData = signal({
    activeCount: 0,
    inactiveCount: 0,
    verifiedCount: 0,
    pendingApprovalCount: 0,
    pendingVerifyCount: 0,
    pendingFirstLoginCount: 0,
  });

  searchText = signal('');

  ngOnInit(): void {
    this.fetchUsersData();
    this.loadUiData();
  }

  fetchUsersData() {
    this.adminService.getUserEmployee(this.searchText(), this.page(), this.limit()).subscribe({
      next: (res) => {
        if (res.data.length == 0) return;
        this.userData.set(res.data as UserEmployeeModel[]);
        this.totalPages.set(res.totalPages);
      },
      error: (error) => {
        this.toast.error(error?.error?.message);
      },
    });
  }

  loadUiData() {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.approvalUiData.set(res as any);
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
        this.userData.update((users) =>
          users.map((user) => (user.employeeId === id ? { ...user, status: 'Active' } : user)),
        );
        this.loadUiData();
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
        this.userData.update((users) =>
          users.map((user) => (user.employeeId === id ? { ...user, status: 'Inactive' } : user)),
        );
        this.loadUiData();
        this.toast.success(res?.message || 'Application Rejected!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
    this.fetchUsersData();
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
    }
    this.fetchUsersData();
  }

  goToPage(index: number) {
    this.page.set(index);
    this.fetchUsersData();
  }

  trackFn(index: number, item: UserModel) {
    return item.employeeId;
  }
}
