import { Routes } from '@angular/router';
import { LoginComponent } from './theme/login/login';
import { SignUpComponent } from './theme/signup/signup';
import { HomeComponent } from './theme/home/home';
import { UserProfileComponent } from './theme/home/user-profile/user-profile';
import { DashboardComponent } from './theme/home/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: UserProfileComponent },
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
];
