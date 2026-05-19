import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { SignUpComponent } from './components/signup/signup';
import { SplashComponent } from './components/splash/splash';
import { ProfileComponent } from './components/profile/profile';
import { DashboardComponent } from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'dashboard', component: DashboardComponent}
];
