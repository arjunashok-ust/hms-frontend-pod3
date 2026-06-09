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
import { ToastrService } from 'ngx-toastr';

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
  toast: ToastrService = inject(ToastrService);

  public constructor(readonly fb: FormBuilder) {
    this.passwordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8),Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      },
      {
        validators: [passwordsMatchValidator],
      },
    );
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.toast.warning("Validation failed,please check the inputs")
      this.passwordForm.markAllAsTouched();
      return;
    }

    const email = localStorage.getItem('email');
    const password = this.passwordForm.value.password;
    const payload = { email: email, password: password };
    this.authService.setPassword(payload).subscribe({
      next: (res) => {
        this.toast.success('New Password Is Set');
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
