import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { ApiService } from '../services/apiService/api-service';
import { map, catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const api = inject(ApiService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const toast: ToastrService = inject(ToastrService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const path = route.routeConfig?.path;

  return api.checkRoutePermission(path!).pipe(
    map((isAllowed) => {
      if (isAllowed) return true;

      if (!router.navigated || router.url === '/' || router.url === '/login') {
        localStorage.clear();
        setTimeout(() => {
          toast.error('403 - Access Denied: You do not have permission to view this page.');
        }, 200);
        return router.parseUrl('/login');
      }
      toast.error('403 - Access Denied: You do not have permission to view this page.');
      return false;
    }),
    catchError(() => {
      setTimeout(() => toast.error('Error verifying permissions.'), 200);
      return router.navigated ? of(false) : of(router.parseUrl('/profile'));
    }),
  );
};
