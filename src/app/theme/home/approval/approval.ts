import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { UserService } from '../../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-approval',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class ApprovalComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

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
    this.adminService.getUsersData().subscribe({
      next: (res) => {
        this.userData = res;
        this.applyFilters();
        this.loadUiData();
        this.cd.detectChanges();
      },
      error: (error) => {
        this.toast.error('Server Error During Get Users');
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
    this.filteredData = this.userData.filter(
      (user) =>
        !this.searchText ||
        user.email.includes(this.searchText) ||
        user.employeeId.includes(this.searchText) ||
        user.role.includes(this.searchText) 
    );
    this.cd.detectChanges();
  }

  approveUser(id: string) {
    const payload = { employeeId: id };
    this.adminService.approveUser(payload).subscribe({
      next: (res) => {
        this.userData = this.userData.map((user)=> user.employeeId === id? {...user, status: 'Active'} : user);
        this.applyFilters();
        this.cd.detectChanges();
        this.toast.success('Account Activated');
      },
      error: (error) => {
        this.toast.error('Server Error During Reject User');
        console.log(error);
      },
    });
  }

  rejectUser(id: string) {
    const payload = { employeeId: id };
    this.adminService.rejectUser(payload).subscribe({
      next: (res) => {
        this.userData = this.userData.map((user)=> user.employeeId === id? {...user, status: 'Inactive'} : user)
        this.toast.success('Application Rejected');
        this.applyFilters();
        this.cd.detectChanges();
      },
      error: (error) => {
        this.toast.error('Server Error During Approve User');
      },
    });
  }
}
