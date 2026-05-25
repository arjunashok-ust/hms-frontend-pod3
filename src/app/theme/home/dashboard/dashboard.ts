import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DashboardModel } from '../../../models/ui.model';
import { UserModel } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardModel | null = null;
  userData: UserModel[] | null = null;

  adminService: AdminService = inject(AdminService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit() {
    this.adminService.getDashboardData().subscribe({
      next: (res) => {
        this.dashboardData = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        alert(err.message);
      },
    });
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.userData = res;

        this.cd.detectChanges();
      },
      error: (err) => {
        alert(err.message);
      },
    });
  }
}
