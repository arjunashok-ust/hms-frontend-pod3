import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { SignUpComponent } from './signup/signup';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signUp', component: SignUpComponent },
];
