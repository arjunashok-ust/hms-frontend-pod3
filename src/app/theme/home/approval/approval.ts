import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { UserEmployeeModel } from '../../../models/user.model';

@Component({
  selector: 'app-approval',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class ApprovalComponent implements OnInit {
  adminService: AdminService = inject(AdminService);

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);
  route: Router = inject(Router);

  userData: UserEmployeeModel[] = [];
  filteredData: UserEmployeeModel[] = [];

  approvalUiData = {
    pendingCount: 0,
    verifiedCount: 0,
    inActiveCount: 0,
    firstLoginCount: 0,
  };

  searchText = '';

  ngOnInit(): void {
    this.adminService.getUserEmployee().subscribe({
      next: (res) => {
        this.userData = res;

        this.applyFilters();
        this.loadUiData();

        this.cd.detectChanges();
      },
      error: (error) => {
        this.toast.error(error?.error?.message);
      },
    });
  }

  loadUiData() {
    this.approvalUiData.pendingCount = this.userData.filter(
      (user) => user.status === 'Pending',
    ).length;

    this.approvalUiData.verifiedCount = this.userData.filter(
      (user) => user.isVerified === true,
    ).length;

    this.approvalUiData.inActiveCount = this.userData.filter(
      (user) => user.status === 'Inactive',
    ).length;

    this.approvalUiData.firstLoginCount = this.userData.filter(
      (user) => user.firstLogin === true,
    ).length;
  }

  applyFilters() {
    const search = this.normalize(this.searchText);
    this.filteredData = this.userData.filter(
      (user) =>
        !search ||
        this.normalize(user.name).includes(search) ||
        this.normalize(user.email).includes(search) ||
        this.normalize(user.employeeId).includes(search) ||
        this.normalize(user.role).includes(search),
    );

    this.cd.detectChanges();
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
        this.applyFilters();

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

        this.applyFilters();

        this.cd.detectChanges();

        this.toast.success(res?.message || 'Application Rejected!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
