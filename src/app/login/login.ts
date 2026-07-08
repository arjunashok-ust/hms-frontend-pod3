import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: '../login/login.css',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  firstLoginMessage = '';
  showPassword = false;

  constructor(
    readonly auth: Auth,
    readonly router: Router,
    readonly cd: ChangeDetectorRef,
  ) {}

  onLogin(form: any) {
    this.errorMessage = '';

    // FORM VALIDATION
    if (form.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    const requestBody = {
      email: this.email,
      password: this.password,
    };

    console.log(requestBody);

    this.auth.login(requestBody).subscribe({
      next: (response: any) => {
        console.log(response);

        const data = response.data;

        // STORE TOKEN
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('firstLogin', String(data.firstLogin));

        // FIRST LOGIN
        if (data.firstLogin) {
          this.firstLoginMessage = response.message;

          setTimeout(() => {
            this.router.navigate(['/reset-password']);
          }, 1000);

          return;
        }

        // ROLE BASED REDIRECT
        this.router.navigate(['/dashboard']);
      },

      error: (err) => {
        console.log(err);

        this.errorMessage = err?.error?.message || 'Invalid Email or Password';

        this.cd.detectChanges();
      },
    });
  }

}
