import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginModel } from '../../models/auth/auth.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.htm',
  styleUrl: './login.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);

  constructor(readonly fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    const payload: LoginModel = this.loginForm.value;
    this.auth.login(payload).subscribe({
      next: (res) => {
        // saving token to local
        localStorage.setItem('token',res.token);
        alert(`${res.message} \n Token : ${res.token}`);
        this.router.navigate(['/profile'], {
          queryParams: { email: payload.email },
        });
      },
      error: (error) => alert(error.message),
    });
  }
}
