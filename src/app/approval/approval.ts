import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective, Pagination],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class Approval implements OnInit {
  
  readonly PERMISSIONS = PERMISSIONS;

  pendingUsers: any[] = [];

  pendingApprovals = 0;
  verifiedUsers = 0;
  inactiveAccounts = 0;
  firstLoginPending = 0;

  loading = true;

  /* PAGINATION */
  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;
  hasPrevPage = false;

  constructor(
    readonly auth: Auth,
    readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
    this.loadApprovalStats();
  }

  /* LOAD TABLE */

  loadPendingApprovals() {
    this.loading = true;
    this.auth.getPendingApprovals({ page: this.currentPage, limit: 5 }).subscribe({
      next: (response: any) => {
        console.log(response);

        this.pendingUsers = response.data || [];

        this.totalPages = response.meta?.totalPages || 1;
        this.hasNextPage = response.meta?.hasNextPage || false;
        this.hasPrevPage = response.meta?.hasPrevPage || false;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err: any) => {
        console.log(err);

        this.loading = false;

        this.cdr.detectChanges();
      },
    });
  }

  /* PAGE CHANGE */
  onPageChange(page: number) {
    /* Ignore clicks while a page request is in flight (dup-request + race guard). */
    if (this.loading) return;
    this.currentPage = page;
    this.loadPendingApprovals();
  }

  /* LOAD STATS */

  loadApprovalStats() {
    this.auth.getApprovalStats().subscribe({
      next: (response: any) => {
        console.log(response);

        this.pendingApprovals = response.data.pendingApprovals || 0;

        this.verifiedUsers = response.data.verifiedUsers || 0;

        this.inactiveAccounts = response.data.inactiveAccounts || 0;

        this.firstLoginPending = response.data.firstLoginPending || 0;

        this.cdr.detectChanges();
      },

      error: (err: any) => {
        console.log(err);

        this.cdr.detectChanges();
      },
    });
  }

  /* APPROVE */

  approveEmployee(employeeId: string) {
    this.auth.approveEmployee(employeeId).subscribe({
      next: (response: any) => {
        console.log(response);

        alert('Employee Approved Successfully');

        this.loadPendingApprovals();

        this.loadApprovalStats();
      },

      error: (err: any) => {
        console.log(err);

        alert('Unable To Approve Employee');
      },
    });
  }

  /* REJECT — hard reject: permanently deletes the pending User + Employee.
     Confirm first since it's irreversible. */
  rejectEmployee(employeeId: string) {
    if (!confirm(`Reject ${employeeId}? This permanently deletes the signup — they would have to register again.`)) {
      return;
    }

    this.auth.rejectEmployee(employeeId).subscribe({
      next: (response: any) => {
        console.log(response);

        alert('Employee Rejected Successfully');

        this.loadPendingApprovals();

        this.loadApprovalStats();
      },

      error: (err: any) => {
        console.log(err);

        alert(err?.error?.message || 'Unable To Reject Employee');
      },
    });
  }
}
