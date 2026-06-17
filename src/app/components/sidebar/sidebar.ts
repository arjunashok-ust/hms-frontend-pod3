import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, MenuNode } from '../../services/apiService/api-service';
import { AppointmentService } from '../../services/appointmentService/appointment-service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {
  menus: MenuNode[] = [];
  pendingAppointmentsCount: number = 0;
  isAdmin: boolean = false;
  constructor(
    private readonly api: ApiService,
    private readonly appointmentService: AppointmentService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userRole = this.getUserRoleFromToken();
      this.isAdmin = (userRole?.toUpperCase() == "ADMIN");
      this.fetchPendingAppointments();

      this.api.getMenus().subscribe({
        next: (response: any) => {
          let rawMenus = Array.isArray(response)
            ? response
            : response.data || response.menuItems || response.menus || [];

          if (userRole) {
            rawMenus = rawMenus.filter((menu: MenuNode) => {
              return menu.rolesAllowed?.includes(userRole);
            });
          } else {
            rawMenus = [];
          }
          this.menus = rawMenus.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to fetch menus.', err),
      });
    }
  }

  fetchPendingAppointments() {
    this.appointmentService.getRecentAppointments().subscribe({
      next: (data: any[]) => {
        this.pendingAppointmentsCount = data.filter(
          (apt) => apt.status?.toUpperCase() === 'PENDING'
        ).length;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching pending appointments for sidebar', err)
    });
  }

  private getUserRoleFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
      const decodedPayload = JSON.parse(decodedJson);
      return decodedPayload.role || null;
    } catch (error) {
      console.error('Failed to decode JWT token', error);
      return null;
    }
  }
}
