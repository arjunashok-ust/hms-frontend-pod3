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
  isLoading = false;
  showFirstLoginModal = false;
  tempEmail = '';
  tempOldPassword = '';

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
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    return control.get('newPassword')?.value === control.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      // 🟢 Create a new payload object combining form values and clientType
      const payload = {
        ...this.loginForm.value,
        clientType: 'web'
      };

      console.log(payload);

      // 🟢 Pass the new payload to the auth service
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

          if (response.token) {
            localStorage.setItem('token', response.token);
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
          this.errorMessage = error.error?.message || 'Invalid email or password';
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
      newPassword: this.passwordForm.value.newPassword,
    };

    this.api.changeFirstPassword(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.showFirstLoginModal = false;

        localStorage.setItem('token', res.token);
        const userRole = res.user?.role?.toUpperCase() || '';

        if (userRole !== 'ADMIN') {
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.success(err.error?.message || 'Failed to update password');
      },
    });
  }

  cancelPasswordChange() {
    this.showFirstLoginModal = false;
    this.passwordForm.reset();
    this.loginForm.reset();
  }
}
