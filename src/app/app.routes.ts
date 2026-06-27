import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { FirstLoginGuard } from './guards/first-login.guard';
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
import { NodeMenu } from './node-menu/node-menu';
import { MedicalRecord } from './medical-record/medical-record';
import { RoleMenu } from './role-menu/role-menu';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'reset-password', component: ResetPassword, canActivate: [FirstLoginGuard] },

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
          roles: ['admin', 'super_admin'],
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
          roles: ['admin', 'super_admin'],
        },
      },

      {
        path: 'employees',
        component: Employee,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'super_admin', 'receptionist'],
        },
      },

      {
        path: 'patients',
        component: Patients,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'super_admin', 'receptionist'],
        },
      },

      {
        path: 'appointments',
        component: Appointment,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'super_admin', 'receptionist', 'doctor'],
        },
      },

      // {
      //   path: 'node-menu',
      //   component: NodeMenu,
      //   canActivate: [roleGuard],
      //   data: {
      //     roles: ['admin', 'super_admin'],
      //   },
      // },

      {
        path: 'medical-records',
        component: MedicalRecord,
        canActivate: [roleGuard],
        data: {
          roles: ['admin', 'super_admin', 'doctor', 'receptionist'],
        },
      },

      // {
      //   path: 'role-menu',
      //   component: RoleMenu,
      //   canActivate: [roleGuard],
      //   data: {
      //     roles: ['admin', 'super_admin'],
      //   },
      // },
    ],
  },

  /* FALLBACK */
  {
    path: '**',
    redirectTo: 'login',
  },
];
