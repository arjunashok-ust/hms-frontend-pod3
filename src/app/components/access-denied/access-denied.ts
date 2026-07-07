/**
 * @file access-denied.ts
 * @description
 * This file defines the component for the 'Access Denied' page.
 *
 * @overview
 * This component is displayed when a user attempts to navigate to a route they do not have permission to access, as determined by the `roleGuard`.
 * It provides a user-friendly message and a logout button to allow the user to sign out and attempt to log in with a different account.
 *
 * Connections:
 *   Angular Router -> roleGuard (on failure) -> ACCESS-DENIED.TS -> (on logout) -> AuthService
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './access-denied.html',
  styleUrls: ['./access-denied.css']
})
export class AccessDenied {
  constructor(
    private readonly router: Router,
  ) { }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}