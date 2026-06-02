import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { passwordsMatchValidator } from '../../../../validators/password-match-validator';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, RouterModule],
  templateUrl: './password-modal.html',
  styleUrl: './password-modal.css',
})
export class PasswordModalComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastrService);

  passwordForm: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    },
    { validators: [passwordsMatchValidator] }
  );

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.toast.error('Please fix validation errors');
      return;
    }

    const email = localStorage.getItem('email') || '';
    const payload = { email,
      password: this.passwordForm.get('password')?.value,
    };

    this.authService.setPassword(payload).subscribe({
      next: () => {
        this.toast.success('Password updated successfully');
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.toast.error(error.message || 'Update failed');
      },
    });
  }
}