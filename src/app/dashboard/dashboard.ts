import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {

  isLoading = true;
  // ERROR
  errorMessage = '';
  // DASHBOARD STATS — null until a successful response actually arrives,
  // so a failed/forbidden request can never render as "everything is zero".

  stats: any = null;

  constructor(
    readonly auth: Auth,
    readonly cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (globalThis.window) {
      const token = localStorage.getItem('token');

      if (token) {
        this.loadDashboardStats();
      }
    }
  }

  loadDashboardStats() {
    this.errorMessage = '';

    this.auth.getDashboardStats().subscribe({
      next: (response: any) => {
        console.log(response);
        this.stats = response.data;
        this.isLoading = false;
        this.cd.markForCheck();
      },

      error: (err: any) => {
        console.log(err);
        this.stats = null;
        this.errorMessage = err?.error?.message || 'Unable to load dashboard stats';
        this.isLoading = false;
        this.cd.markForCheck();
      },
    });
  }
}
