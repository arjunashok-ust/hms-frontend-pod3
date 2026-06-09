import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const FirstLoginGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  const firstLogin = localStorage.getItem('firstLogin');

  if (token && firstLogin === 'true') {
    return true;
  }

  router.navigate(['/login']);

  return false;
};
