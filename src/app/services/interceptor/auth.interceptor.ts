import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { ApiUrl } from '../../environment/environment';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

let isRefreshing = false;
// for queue
const refreshToken$ = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const api = inject(ApiUrl);

  const refresh_url = `${api.backend_url}/auth/refresh-token`;

  if (req.url == refresh_url) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  if (token && !isTimeExpired(token)) {
    req = addToken(req, token);
    return next(req);
  }

  if (token && isTimeExpired(token)) {
    if (isRefreshing) {
      return refreshToken$.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next(addToken(req, token))),
      );
    } else {
      isRefreshing = true;
      refreshToken$.next(null);

      return http
        .get(refresh_url, {
          withCredentials: true,
        })
        .pipe(
          switchMap((res: any) => {
            const newToken = res.token;
            localStorage.setItem('token', newToken);
            isRefreshing = false;
            refreshToken$.next(newToken);
            return next(addToken(req, newToken));
          }),
          catchError((err) => {
            isRefreshing = false;
            refreshToken$.next(null);
            localStorage.clear();
            return throwError(() => err);
          }),
        );
    }
  }

  return next(req);
};

function addToken(req: any, token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isTimeExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    return Date.now() > expiry;
  } catch (err) {
    console.error(err);
    return true;
  }
}
