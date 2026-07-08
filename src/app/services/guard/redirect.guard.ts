import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (token) {
    return router.createUrlTree(['/profile']);
  }

  return router.createUrlTree(['/login']);
};
