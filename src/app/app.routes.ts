import { Routes } from '@angular/router';

import { LoginComponent } from './login/login';
import { SignupComponent } from './signup/signup';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [

  // ✅ Default route
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ✅ Public routes
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // ✅ Protected layout routes
  {
    path: '',
    component: MainLayout,
    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.DashboardComponent)
      },

      {
  path: 'appointments',
  loadComponent: () =>
    import('./pages/appointment/appointment')
      .then(m => m.AppointmentComponent)
},

      {
        path: 'profile',
        loadComponent: () =>
          import('./user/user')
            .then(m => m.UserComponent)
      },

      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patient/patient')
            .then(m => m.Patient)
      },

      {
        path: 'employees',
        loadComponent: () =>
          import('./pages/employee/employee')
            .then(m => m.EmployeesComponent)
      }

    ]
  }

];