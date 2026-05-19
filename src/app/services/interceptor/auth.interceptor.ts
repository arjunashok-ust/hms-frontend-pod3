import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token && !isTimeExpired(token)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req);
};

function isTimeExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.expiresIn * 1000;
    return Date.now() > expiry;
  } catch (err) {
    console.error(err);
    return true;
  }
}
