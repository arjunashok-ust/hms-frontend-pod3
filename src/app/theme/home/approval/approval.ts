import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-approval',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class ApprovalComponent implements OnInit {
  adminService = inject(AdminService);
  toast = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  userData: UserModel[] = [];
  filteredData: UserModel[] = [];

  approvalUiData = {
    pendingCount: 0,
    verifiedCount: 0,
    inActiveCount: 0,
    firstLoginCount: 0,
  };

  searchText = '';

  ngOnInit(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.userData = res;
        this.applyFilters();
        this.loadUiData();
        this.cd.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to fetch users');
      },
    });
  }

  loadUiData(): void {
    this.approvalUiData.pendingCount = this.userData.filter(u => u.status === 'Pending').length;
    this.approvalUiData.verifiedCount = this.userData.filter(u => u.isVerified).length;
    this.approvalUiData.inActiveCount = this.userData.filter(u => u.status === 'Inactive').length;
    this.approvalUiData.firstLoginCount = this.userData.filter(u => u.firstLogin).length;
  }

  applyFilters(): void {
    this.filteredData = this.userData.filter(
      (u) =>
        !this.searchText ||
        u.email.includes(this.searchText) ||
        u.employeeId.includes(this.searchText) ||
        u.roles.includes(this.searchText)
    );
  }

  approveUser(id: string): void {
    this.adminService.approveUser({ employeeId: id }).subscribe({
      next: () => {
        this.toast.success('Approved');
        this.userData = this.userData.map(u =>
          u.employeeId === id ? { ...u, status: 'Active' } : u
        );
        this.applyFilters();
      },
      error: () => this.toast.error('Approval failed'),
    });
  }

  rejectUser(id: string): void {
    this.adminService.rejectUser({ employeeId: id }).subscribe({
      next: () => {
        this.toast.success('Rejected');
        this.userData = this.userData.map(u =>
          u.employeeId === id ? { ...u, status: 'Inactive' } : u
        );
        this.applyFilters();
      },
      error: () => this.toast.error('Reject failed'),
    });
  }
}