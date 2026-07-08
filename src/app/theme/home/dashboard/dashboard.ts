import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DashboardModel } from '../../../models/ui.model';
import { EmployeeModel } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  dashboardData = signal<DashboardModel | null>(null);
  userData = signal<EmployeeModel[]>([]);

  adminService: AdminService = inject(AdminService);
  toast: ToastrService = inject(ToastrService);

  employeeEmail = signal(localStorage.getItem('email') ?? '');

  ngOnInit() {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.dashboardData.set(res);
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });

    this.adminService.getEmployees('', '', 1, 5).subscribe({
      next: (res) => {
        this.userData.set(res.data);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error getting employee data');
      },
    });
  }
}
