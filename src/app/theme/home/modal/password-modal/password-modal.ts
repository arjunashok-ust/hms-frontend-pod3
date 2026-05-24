import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { passwordsMatchValidator } from '../../../../validators/password-match-validator';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, RouterModule],
  templateUrl: './password-modal.html',
  styleUrl: './password-modal.css',
})
export class PasswordModalComponent {
  passwordForm!: FormGroup;
  router: Router = inject(Router);
  authService: AuthService = inject(AuthService);
  public constructor(readonly fb: FormBuilder) {
    this.passwordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      },
      {
        validators: [passwordsMatchValidator],
      },
    );
  }

  onSubmit() {
    let email = localStorage.getItem('email');
    let password = this.passwordForm.value.password;
    const payload = { email: email, password: password };
    this.authService.setPassword(payload).subscribe({
      next: (res)=>{
        alert('New Password Is Set');
      },
      error: (error) => {
        alert(error);
      }
    });
    this.router.navigate(['/profile']);
  }
}
