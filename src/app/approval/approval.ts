import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approval.html',
  styleUrl: './approval.css',
})
export class Approval implements OnInit {
  pendingUsers: any[] = [];

  pendingApprovals = 0;
  verifiedUsers = 0;
  inactiveAccounts = 0;
  firstLoginPending = 0;

  loading = true;

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
    this.auth.getPendingApprovals().subscribe({
      next: (response: any) => {
        console.log(response);

        this.pendingUsers = response.data || [];

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

  /* LOAD STATS */

  loadApprovalStats() {
    this.auth.getApprovalStats().subscribe({
      next: (response: any) => {
        console.log(response);

        this.pendingApprovals = response.pendingApprovals || 0;

        this.verifiedUsers = response.verifiedUsers || 0;

        this.inactiveAccounts = response.inactiveAccounts || 0;

        this.firstLoginPending = response.firstLoginPending || 0;

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
}
