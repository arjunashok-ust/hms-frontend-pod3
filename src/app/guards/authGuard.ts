/**
 * @file authGuard.ts
 * @description
 * This file defines a route guard to protect routes that require authentication.
 *
 * @overview
 * This function is a route guard that prevents unauthenticated users from accessing protected routes.
 * It checks for the presence of an authentication token using the `Auth` service.
 * If the user is not authenticated, it redirects them to the login page.
 *
 * Connections:
 *   Angular Router (on navigation) -> AUTHGUARD.TS -> AuthService -> (allow/deny navigation and redirect)
 */
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/authService/auth-service';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};
