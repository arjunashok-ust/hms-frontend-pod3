import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DashboardModel } from '../../../models/ui.model';
import { EmployeeModel } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  route: Router = inject(Router);

  ngOnInit() {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.dashboardData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || "You are not authorized to visit this page.");
        if(err.status === 403){
          this.route.navigate(['/access-denied']);
        }
      },
    });
    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.userData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err?.error?.message || "Error getting employee data");
      },
    });
  }
}
