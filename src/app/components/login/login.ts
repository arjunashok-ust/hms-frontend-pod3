import { Component, inject, ChangeDetectorRef } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/authService/auth-service';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMessage: string | null = null;
  loginForm: FormGroup;
  passwordForm: FormGroup;
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isForgotPasswordLoading = false;
  showFirstLoginModal = false;
  showForgotPasswordModal = false;
  tempEmail = '';
  tempOldPassword = '';
  forgotPasswordMessage: string | null = null;

  toast: ToastrService = inject(ToastrService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.passwordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      },
    );

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    return control.get('newPassword')?.value === control.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const payload = {
        ...this.loginForm.value,
        clientType: 'web'
      };

      console.log(payload);

      this.auth.login(payload).subscribe({
        next: (response) => {

          this.isLoading = false;
          console.log('Backend Login Success:', response);

          if (response.requiresPasswordChange) {
            this.tempEmail = this.loginForm.value.email;
            this.tempOldPassword = this.loginForm.value.password;
            this.showFirstLoginModal = true;
            this.cdr.detectChanges();
            return;
          }

          if (response.accessToken) {
            localStorage.setItem('token', response.accessToken);
          }

          const userRole = response.user?.role?.toUpperCase() || '';

          if (userRole === 'ADMIN') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/profile']);
          }
        },
        error: (error) => {
          this.isLoading = false;

          // 1. Check for absolute absence of network response (Status 0)
          const isNoResponse = error?.status === 0;

          // 2. Check for intermediate gateway errors (Backend crashed, proxy survived)
          const isGatewayError = error?.status >= 500 && error?.status <= 504;

          if (isNoResponse || isGatewayError) {
            this.errorMessage = 'Server is down or unreachable. Please try again later.';
          } else if (error?.status === 401) {
            this.errorMessage = 'Invalid credentials.';
          } else {
            // Provide exact backend message if available, else generic fallback
            this.errorMessage =
              error?.error?.message || error?.message ||
              'An unexpected error occurred.';
          }

          this.cdr.markForCheck();
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  onChangePasswordSubmit() {
    if (this.passwordForm.invalid) return;
    this.isLoading = true;

    const payload = {
      email: this.tempEmail,
      oldPassword: this.tempOldPassword,
      password: this.passwordForm.value.newPassword,
    };

    this.api.changeFirstPassword(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.showFirstLoginModal = false;

        if (res.accessToken) {
          localStorage.setItem('token', res.accessToken);
        }
        const userRole = res.user?.role?.toUpperCase() || '';

        if (userRole !== 'ADMIN') {
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err.error?.message || 'Failed to update password');
      },
    });
  }

  openForgotPasswordModal() {
    this.forgotPasswordMessage = null;
    this.showForgotPasswordModal = true;
    this.forgotPasswordForm.reset();
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordForm.reset();
    this.forgotPasswordMessage = null;
  }

  onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isForgotPasswordLoading = true;
    this.forgotPasswordMessage = null;

    this.api.requestPasswordReset({ email: this.forgotPasswordForm.value.email }).subscribe({
      next: (res: any) => {
        this.isForgotPasswordLoading = false;
        const message = res?.message || 'If your account exists, a reset email has been sent.';
        this.forgotPasswordMessage = message;
        this.toast.success(message);
        this.forgotPasswordForm.reset();
        this.showForgotPasswordModal = false;
      },
      error: (err) => {
        this.isForgotPasswordLoading = false;
        const message = err?.error?.message || 'Unable to send a password reset email right now.';
        this.forgotPasswordMessage = message;
        this.toast.error(message);
      },
    });
  }

  cancelPasswordChange() {
    this.showFirstLoginModal = false;
    this.passwordForm.reset();
    this.loginForm.reset();
  }
}
