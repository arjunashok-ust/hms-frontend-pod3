import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { ApiService } from '../services/apiService/api-service';
import { map, catchError, of } from 'rxjs';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
    const api = inject(ApiService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    const path = route.routeConfig?.path;

    return api.checkRoutePermission(path!).pipe(
        map(isAllowed => {
            if (isAllowed) return true;

            alert('403 - Access Denied: You do not have permission to view this page.');

            if (router.url === '/' || router.url === '/login') {
                return router.parseUrl('/profile');
            }

            return false;
        }),
        catchError(() => {
            alert('Error verifying permissions.');
            return of(false);
        })
    );
};