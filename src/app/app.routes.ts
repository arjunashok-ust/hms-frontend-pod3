import { Routes } from '@angular/router';
import { LoginComponent } from './theme/login/login';
import { SignUpComponent } from './theme/signup/signup';
import { HomeComponent } from './theme/home/home';
import { UserProfileComponent } from './theme/home/user-profile/user-profile';
import { DashboardComponent } from './theme/home/dashboard/dashboard';
import { AppointmentComponent } from './theme/home/appointment/appointment';
import { PasswordModalComponent } from './theme/home/modal/password-modal/password-modal';
import { EmployeeComponent } from './theme/home/employee/employee';
import { SignUpModalComponent } from './theme/home/modal/signup-modal/signup-modal';
import { ApprovalComponent } from './theme/home/approval/approval';
import { PatientComponent } from './theme/home/patient/patient';
import { EditEmployeeComponent } from './theme/home/modal/edit-employee/edit-employee';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: UserProfileComponent },
      { path: 'appointment', component: AppointmentComponent },
      { path: 'employee', component: EmployeeComponent },
      { path: 'password-modal', component: PasswordModalComponent },
      { path: 'signup-modal', component: SignUpModalComponent},
      { path: 'approval', component: ApprovalComponent},
      { path: 'patient', component: PatientComponent},
      { path: 'edit-employee', component: EditEmployeeComponent}
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
];
