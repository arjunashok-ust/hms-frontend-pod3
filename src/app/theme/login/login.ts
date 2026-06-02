import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RouterModule],
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  toastMsg = inject(ToastrService);

  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    localStorage.clear();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        localStorage.setItem('authToken', res.token);
        localStorage.setItem('userRole', res.role);
        localStorage.setItem('employeeData', JSON.stringify(res.employee));

        this.toastMsg.success('Login successful');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toastMsg.error(err?.error?.message || 'Login failed');
      },
    });
  }
}