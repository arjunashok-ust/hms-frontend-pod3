import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DashboardModel } from '../../../models/ui.model';
import { EmployeeModel, UserEmployeeModel } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class DashboardComponent implements OnInit {
  dashboardData: DashboardModel | null = null;
  userData: EmployeeModel[] | null = null;

  adminService: AdminService = inject(AdminService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  ngOnInit() {
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

        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.message);
      },
    });
  }
}
