import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { Approval } from './approval/approval';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { User } from './user/user';
import { Dashboard } from './dashboard/dashboard';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';
import { Employee } from './employee/employee';
import { ResetPassword } from './reset-password/reset-password';
import { Patients } from './patients/patients';
import { Appointment } from './appointment/appointment';

export const routes: Routes = [
  /* DEFAULT */
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  /* AUTH */
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },

  /* RESET PASSWORD */
  { path: 'reset-password', component: ResetPassword },

  /* PROTECTED ROUTES */
  {
    path: '',
    component: DashboardLayout,
    canActivate: [authGuard],

    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard],
        data: {
          roles: ['admin'],
        },
      },

      {
        path: 'profile',
        component: User,
      },
      {
        path: 'approval',
        component: Approval,
        canActivate: [roleGuard],
        data: {
          roles: ['admin'],
        },
      },

      {
        path: 'employees',
        component: Employee,
        canActivate: [roleGuard],
        data: {
          roles: ['admin'],
        },
      },

      {
        path: 'patients',
        component: Patients,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'receptionist'],
        },
      },

      {
        path: 'appointments',
        component: Appointment,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'receptionist', 'doctor'],
        },
      },
    ],
  },

  /* FALLBACK */
  {
    path: '**',
    redirectTo: 'login',
  },
];
