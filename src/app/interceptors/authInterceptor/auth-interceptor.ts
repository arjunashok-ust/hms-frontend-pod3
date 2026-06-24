import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../../services/authService/auth-service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(Auth);
  const router = inject(Router);

  const platformId = inject(PLATFORM_ID);

  let token = null;

  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('token');
  }

  const authReq = token
    ? req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    })
    : req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isPlatformBrowser(platformId) && !req.url.includes('/auth/refresh')) {
        if (isRefreshing) {
          // If a refresh is already in progress, wait for it to complete
          return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(jwt => {
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } });
              return next(retryReq);
            })
          );
        } else {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshAccessToken().pipe( // 1. Attempt to refresh
            switchMap((refreshResponse) => { // 2. If refresh is successful...
              isRefreshing = false;
              const newToken = refreshResponse?.accessToken;
              if (!newToken) {
                // If refresh call is successful but returns no token, logout
                authService.logout();
                router.navigate(['/login']);
                return throwError(() => new Error('Token refresh failed: No new token received'));
              }
              authService.setAccessToken(newToken);
              refreshTokenSubject.next(newToken);
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
                withCredentials: true,
              });
              return next(retryReq); // 3. Retry the original request with the new token
            }),
            catchError((refreshError) => { // 4. This ONLY catches errors from refreshAccessToken()
              isRefreshing = false;
              authService.logout(); // Logout user
              router.navigate(['/login']); // Redirect to login
              // Return the error from the refresh token call
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
