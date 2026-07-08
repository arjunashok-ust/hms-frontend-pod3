import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '../../services/permission.service';
import { ForgotPasswordComponent } from '../home/modal/forgot-password/forgot-password';

@Component({
  selector: 'app-login',
  templateUrl: './login.htm',
  styleUrl: './login.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterModule, ForgotPasswordComponent],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  auth: AuthService = inject(AuthService);
  permission: PermissionService = inject(PermissionService);
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);

  isLoading = signal(false);
  isForgotPassword = signal(false);

  constructor(readonly fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-z0-9._]+@[a-z0-9]*\.[a-z]{2,}$/i)]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    localStorage.clear();

    const nav = history.state;

    if (nav !== undefined) {
      this.isForgotPassword.set(nav.isForgotPassword);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toast.warning('Please fill the required fields.');
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.auth.login(payload).subscribe({
      next: (loginRes) => {
        if (loginRes.status !== 'Active') {
          this.isLoading.set(false);
          this.toast.info('Your account is not activated yet,Please contact the admin');
          this.router.navigate(['/login']);
          return;
        }

        // saving token to local
        localStorage.setItem('token', loginRes.token);
        localStorage.setItem('email', loginRes.email);
        localStorage.setItem('role', loginRes.role);

        const role: string = loginRes.role;
        this.auth.getPermissions(role).subscribe({
          next: (res) => {
            this.permission.setPermission(res.role_permissions);

            if (loginRes.role === 'Patient') {
              this.isLoading.set(false);
              this.toast.error('Patients are allowed to log in only through the mobile app.');
              this.router.navigate(['/access-denied']);
              return;
            }

            if (loginRes.firstLogin) {
              this.isLoading.set(false);
              this.toast.info('Set your password');
              this.router.navigate(['/password-modal']);
            } else {
              this.isLoading.set(false);
              this.toast.success('Login Successfull');
              this.router.navigate(['/profile']);
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.toast.error('Error fetching user permissions');
          },
        });
      },
      error: (error) => {
        if (error.status === 401) {
          this.isLoading.set(false);
          this.toast.warning('Invalid email or password');
        } else {
          this.isLoading.set(false);
          this.toast.error(error?.error?.message || error?.message || 'Login Failed!');
        }
      },
    });
  }
}
