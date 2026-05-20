import { Routes } from '@angular/router';
import { LoginComponent } from './theme/login/login';
import { SignUpComponent } from './theme/signup/signup';
import { ProfileComponent } from './theme/profile/profile';
import { LayoutComponent } from './theme/layout/layout';

export const routes: Routes = [
  { path: '', component:  LayoutComponent},
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
  { path: 'profile', component: ProfileComponent },
];