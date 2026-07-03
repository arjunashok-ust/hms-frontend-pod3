import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  router: Router = inject(Router);
  authService: AuthService = inject(AuthService);
  toast: ToastrService = inject(ToastrService);

  email = signal('');
  isLoading = signal(false);

  @ViewChild('emailModel')
  emailModel!: NgModel;

  backToLogin() {
    this.router.navigate(['/login'], {
      state: { isForgotPassword: false },
    });
  }

  onSubmit() {
    if (this.emailModel?.invalid) {
      this.toast.warning('Check all input fields and try again.');
      this.emailModel.control.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const payload = {
      email: this.email(),
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message, 'Email Sent');
        this.isLoading.set(false);
        this.backToLogin();
      },
      error: (err) => {
        this.toast.error(err.message || 'Unknown error while resetting password.');
        this.isLoading.set(false);
      },
    });
  }
}
