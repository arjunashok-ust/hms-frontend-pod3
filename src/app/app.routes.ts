import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { LayoutComponent } from './components/layout/layout';
import { Appointment } from './components/appointment/appointment';
import { Dashboard } from './components/dashboard/dashboard';
import { Profile } from './components/profile/profile';
import { Employee } from './components/employee/employee';
import { Approvals } from './components/approvals/approvals';
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
      {
        path: 'dashboard', component: Dashboard, canActivate: [roleGuard], data: {
          permissions: ['VIEW_DASHBOARD','ADMIN_ACCESS']
        }
      },
      {
        path: 'appointments', component: Appointment, canActivate: [roleGuard], data: {
          permissions: ['ADMIN_ACCESS', 'RECEPTIONIST_ACCESS','DOCTOR_ACCESS','CREATE_APOINTMENT_FOR_ANY_DOCTOR', 'VIEW_ALL_APPOINTMENT','COMPLETE_APPOINTMENT', 'VIEW_MY_APPOINTMENT', 'UPDATE_APPOINTMENT', 'DELETE_APPOINTMENT', 'APPROVE_APPOINTMENT']
        }
      },
      {
        path: 'profile', component: Profile, canActivate: [roleGuard], data: {
          permissions: ['VIEW_SELF']
        }
      },
      {
        path: 'employees', component: Employee, canActivate: [roleGuard], data: {
          permissions: ['CREATE_EMPLOYEE', 'VIEW_EMPLOYEES', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE', 'APPROVE_EMPLOYEE']
        }
      },
      {
        path: 'approvals', component: Approvals, canActivate: [roleGuard], data: {
          permissions: ['CREATE_PATIENT', 'VIEW_PATIENT', 'UPDATE_PATIENT', 'DELETE_PATIENT']
        }
      },
      {
        path: 'patients', component: Patient, canActivate: [roleGuard], data: {
          permissions: ['CREATE_PATIENT', 'VIEW_PATIENT', 'UPDATE_PATIENT', 'DELETE_PATIENT']
        }
      },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ],
  },
];