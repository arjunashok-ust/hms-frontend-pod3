import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Auth } from '../services/auth';


let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/* Always send credentials (so the httpOnly refresh cookie flows) and attach the
   current access token. */
function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function forceLogout(router: Router, err?: unknown) {
  localStorage.clear();
  router.navigate(['/login']);
  return throwError(() => err ?? new Error('Session expired'));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = localStorage.getItem('token');

  /* Never run refresh logic for the auth endpoints themselves (prevents loops). */
  const isAuthEndpoint =
    req.url.includes('/login') || req.url.includes('/refresh') || req.url.includes('/logout');

  return next(addToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      /* First request to hit a 401 owns the refresh. */
      if (!isRefreshing) {
        isRefreshing = true;
        refreshedToken$.next(null);

        return auth.refresh().pipe(
          switchMap((res: any) => {
            const newToken = res?.data?.token;
            isRefreshing = false;

            if (!newToken) {
              return forceLogout(router);
            }

            localStorage.setItem('token', newToken);
            refreshedToken$.next(newToken); // release any queued requests
            return next(addToken(req, newToken));
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            return forceLogout(router, refreshErr);
          }),
        );
      }

      return refreshedToken$.pipe(
        filter((t): t is string => t !== null),
        take(1),
        switchMap((newToken) => next(addToken(req, newToken))),
      );
    }),
  );
};
