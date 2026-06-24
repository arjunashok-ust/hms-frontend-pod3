import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboardService/dashboard-service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  statsCards: any[] = [];
  employees: any[] = [];
  isLoading = true;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        console.log(data);
        this.statsCards = [
          {
            title: 'Total Employees',
            value: data.totalEmployees || 0,
            icon: 'people-fill',
            color: '#3b82f6',
            bg: '#eff6ff',
          },
          {
            title: 'Active Employees',
            value: data.activeEmployees || 0,
            icon: 'person-check-fill',
            color: '#22c55e',
            bg: '#f0fdf4',
          },
          {
            title: 'Pending Approvals',
            value: data.pendingApprovals || 0,
            icon: 'hourglass-split',
            color: '#f59e0b',
            bg: '#fffbeb',
          },
          {
            title: 'Pending Verifications',
            value: data.pendingVerifications || 0,
            icon: 'shield-lock-fill',
            color: '#8b5cf6',
            bg: '#f5f3ff',
          },
          {
            title: 'Total Patients',
            value: data.totalPatients || 0,
            icon: 'heart-pulse-fill',
            color: '#06b6d4',
            bg: '#ecfeff',
          },
          {
            title: 'Departments',
            value: data.totalDepartments || 0,
            icon: 'building',
            color: '#4b5563',
            bg: '#f3f4f6',
          },
          {
            title: 'Appointments',
            value: data.totalAppointments || 0,
            icon: 'calendar-check-fill',
            color: '#ef4444',
            bg: '#fef2f2',
          },
        ];

        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching stats', err),
    });

    this.dashboardService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.isLoading = false;
      },
    });
  }
  getInitials(name: string): string {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }
}
