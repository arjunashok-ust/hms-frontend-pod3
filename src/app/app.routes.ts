import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { LayoutComponent } from './components/layout/layout';
import { Appointment } from './components/appointment/appointment';
import { Dashboard } from './components/dashboard/dashboard';
import { Profile } from './components/profile/profile';
import { Employee } from './components/employee/employee';
import { Patient } from './components/patient/patient';
import { authGuard } from './guards/authGuard';
import { roleGuard } from './guards/roleGuard';
import { AccessDenied } from './components/access-denied/access-denied';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'access-denied', component: AccessDenied },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [roleGuard] },
      { path: 'appointments', component: Appointment, canActivate: [roleGuard] },
      { path: 'profile', component: Profile, canActivate: [roleGuard] },
      { path: 'employees', component: Employee, canActivate: [roleGuard] },
      { path: 'patients', component: Patient, canActivate: [roleGuard] },
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'approvals',
        component: Employee,
        data: { openApprovalsByDefault: true }
      },
    ],
  },
];
