import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const toast = inject(ToastrService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const requiredPermissions: string[] = route.data?.['permissions'] || [];

  if (requiredPermissions.length === 0) {
    return true;
  }

  let userPermissions: string[] = [];
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
      userPermissions = JSON.parse(decodedJson).permissions || [];
    }
  } catch (error) {
    console.error('Error parsing token for permissions', error);
    toast.error('Session error. Please log in again.');
    return router.parseUrl('/login');
  }

  const hasAccess = requiredPermissions.some(p => userPermissions.includes(p));

  if (hasAccess) {
    return true;
  }

  toast.warning('Access Denied: You lack permissions for this resource.');
  return router.parseUrl('/access-denied');
};