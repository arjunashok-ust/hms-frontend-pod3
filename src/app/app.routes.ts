import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { SignUpComponent } from './signup/signup';
import { SplashComponent } from './splash/splash';
import { ProfileComponent } from './profile/profile';
import { DashboardComponent } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'dashboard', component: DashboardComponent}
];
