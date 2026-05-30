import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/apiService/api-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  user: any = null;
  isLoading = true;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.apiService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.user = response.user || response;
        const tokenRole = this.getRoleFromToken();
        if (tokenRole) {
          this.user.role = Array.isArray(tokenRole) ? tokenRole[0] : tokenRole;
        } else {
          console.warn('Role not found in JWT or token is missing.');
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
      const jsonPayload = decodeURIComponent(
        globalThis.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.codePointAt(0)!.toString(16)).slice(-2);
        }).join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT payload', e);
      return null;
    }
  }

  private getRoleFromToken(): string | string[] | null {
    const token = localStorage.getItem('token');

    if (!token) return null;

    const decodedToken = this.decodeJWT(token);

    return decodedToken ? decodedToken.role : null;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  }
}