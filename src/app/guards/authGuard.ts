import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/authService/auth-service';

export const authGuard = () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    if (auth.isAuthenticated()) {
        return true;
    }

    return router.parseUrl('/login');
};