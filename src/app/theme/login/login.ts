import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginModel } from '../../models/auth.model';
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
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

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
        localStorage.setItem('token', res.token);
        localStorage.setItem('email', res.email);
        this.cd.detectChanges();
        alert(`${res.message} \n`);
        if (res.firstLogin) {
          this.router.navigate(['/password-modal']);
        }
        else{
          this.router.navigate(['/profile']);
        }
      },
      error: (error) => alert(error.message),
    });
  }
}
