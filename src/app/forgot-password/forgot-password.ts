import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword implements OnInit {
  email = '';
  errorMessage = '';
  successMessage = '';


   ngOnInit(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('firstLogin');
  }
  constructor(
    readonly auth: Auth,
    readonly router: Router,
  ) {}

  onSubmit(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.auth.forgotPassword(this.email).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;

        this.email = '';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },

      error: (err) => {
        this.errorMessage = err?.error?.message || 'Something went wrong.';
      },
    });
  }
}
