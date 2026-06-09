import { Component, OnInit,ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../services/auth';


@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {

  // LOADING

  isLoading = true;

  // DASHBOARD STATS

  stats: any = {

    totalEmployees: 0,

    activeEmployees: 0,

    pendingApprovals: 0,

    pendingVerifications: 0,

    totalPatients: 0,

    totalDepartments: 0,

    totalAppointments: 0

  };

  constructor(
    readonly auth: Auth,
    readonly cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    if (globalThis.window) {

      const token = localStorage.getItem("token");

      if (token) {

        this.loadDashboardStats();

      }

    }

  }

  loadDashboardStats() {

    this.auth.getDashboardStats().subscribe({

      next: (response: any) => {
        console.log(response);
        this.stats = response;
        this.isLoading = false;
        this.cd.detectChanges();

      },

      error: (err: any) => {
        console.log(err);
        this.isLoading = false;
        this.cd.detectChanges();

      }

    });

  }

}