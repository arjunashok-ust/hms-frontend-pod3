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
      setTimeout(() => {
        toast.warning('Access Denied: You lack permissions for this resource.');
      }, 200);

      return router.parseUrl('/access-denied');
    }),
    catchError(() => {
      setTimeout(() => toast.error('Error verifying permissions.'), 200);
      return of(router.parseUrl('/access-denied'));
    })
  );
};