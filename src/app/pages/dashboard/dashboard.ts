import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard';
import { EmployeeService } from '../../services/employee';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  stats: any = {};
  employees: any[] = [];

  loadingStats: boolean = true;
  loadingEmployees: boolean = true;

  // ✅ IMPORTANT: use variable (NOT getter)
  loading: boolean = true;

  constructor(
    private dashboardService: DashboardService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadEmployees();
  }

  // ✅ LOAD STATS
  loadStats() {
    this.dashboardService.getDashboardStats().subscribe({
      next: (res: any) => {
        console.log("✅ Stats API:", res);

        this.stats = res.data;

        this.loadingStats = false;
        this.updateLoading();
      },
      error: (err: any) => {
        console.error("❌ Stats Error:", err);

        this.loadingStats = false;
        this.updateLoading();
      }
    });
  }

  // ✅ LOAD EMPLOYEES
  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (res: any) => {
        console.log("✅ Employees API:", res);

        this.employees = res.data || [];

        this.loadingEmployees = false;
        this.updateLoading();
      },
      error: (err: any) => {
        console.error("❌ Employees Error:", err);

        this.loadingEmployees = false;
        this.updateLoading();
      }
    });
  }

  // ✅ FIXED LOADING HANDLER
  updateLoading() {
    this.loading = this.loadingStats || this.loadingEmployees;
  }
}