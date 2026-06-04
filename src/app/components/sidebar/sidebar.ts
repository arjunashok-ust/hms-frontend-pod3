import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, MenuNode } from '../../services/apiService/api-service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {
  menus: MenuNode[] = [];

  constructor(
    private readonly api: ApiService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userRole = this.getUserRoleFromToken();

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
