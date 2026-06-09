import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-reset-password',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './reset-password.html',

  styleUrl: './reset-password.css',
})
export class ResetPassword {
  oldPassword = '';

  newPassword = '';

  confirmPassword = '';

  errorMessage = '';

  successMessage = '';

  constructor(
    readonly auth: Auth,

    readonly router: Router,
  ) {}

  onResetPassword(form: any) {
    /* CLEAR MESSAGES */

    this.errorMessage = '';

    this.successMessage = '';

    /* FORM VALIDATION */

    if (form.invalid) {
      this.errorMessage = 'Please fill all fields';

      return;
    }

    /* PASSWORD MATCH */

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';

      return;
    }

    /* PAYLOAD */

    const payload = {
      oldPassword: this.oldPassword,

      newPassword: this.newPassword,
    };

    /* API */

    this.auth.resetPassword(payload).subscribe({
      next: (response: any) => {
        console.log(response);

        /* SUCCESS ALERT */

        alert(response.message);

        /* REMOVE TOKEN */

        localStorage.removeItem('token');
        localStorage.removeItem('firstLogin');
        localStorage.removeItem('role');

        /* REDIRECT LOGIN */

        this.router.navigate(['/login']);
      },

      error: (err: any) => {
        console.log(err);

        this.errorMessage = err?.error?.message || 'Unable to reset password';
      },
    });
  }
}
