import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardModel | null = null;
  userData: EmployeeModel[] = [];
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  adminService = inject(AdminService);
  toast = inject(ToastrService);

  ngOnInit(): void {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.dashboardData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });

    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.userData = res;
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });
  }
}