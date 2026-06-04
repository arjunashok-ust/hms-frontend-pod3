import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../services/apiService/api-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements OnInit {
  currentUser: any = null;

  constructor(
    private readonly api: ApiService,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.api.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error fetching profile', err),
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '!';
    return name.charAt(0).toUpperCase();
  }

  logout() {
    localStorage.removeItem('token');

    localStorage.removeItem('userRole');

    this.router.navigate(['/login']);
  }
}
