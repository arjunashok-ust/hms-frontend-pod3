import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { FirstLoginGuard } from './guards/first-login.guard';

/* Routes use loadComponent for lazy, route-level code splitting — each feature
   is bundled separately and only fetched when its route is first activated. */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup').then((m) => m.Signup),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password').then((m) => m.ResetPassword),
    canActivate: [FirstLoginGuard],
  },

  /* PROTECTED ROUTES */
  {
    path: '',
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout').then(
        (m) => m.DashboardLayout,
      ),
    canActivate: [authGuard],

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
      },
      {
        path: 'profile',
        loadComponent: () => import('./user/user').then((m) => m.User),
      },
      {
        path: 'approval',
        loadComponent: () =>
          import('./approval/approval').then((m) => m.Approval),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./employee/employee').then((m) => m.Employee),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin', 'receptionist'] },
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./patients/patients').then((m) => m.Patients),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin', 'receptionist'] },
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./appointment/appointment').then((m) => m.Appointment),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin', 'receptionist', 'doctor'] },
      },

      {
        path: 'medical-records',
        loadComponent: () =>
          import('./medical-record/medical-record').then((m) => m.MedicalRecord),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin', 'doctor', 'receptionist'] },
      },
       {
        path: 'node-menu',
        loadComponent: () => import('./node-menu/node-menu').then((m) => m.NodeMenu),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
      },
      {
        path: 'role-menu',
        loadComponent: () => import('./role-menu/role-menu').then((m) => m.RoleMenu),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
      },
    ],
  },

  /* FALLBACK */
  { path: '**', redirectTo: 'login' },
];
