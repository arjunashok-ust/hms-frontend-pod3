import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.htm',
  styleUrl: './login.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink,RouterModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  constructor(readonly fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    localStorage.clear();
  }

  onSubmit() {
    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    }
    this.auth.login(payload).subscribe({
      next: (res) => {
        // saving token to local
        localStorage.setItem('token', res.token);
        localStorage.setItem('email', res.email);
        this.cd.detectChanges();
        if(res.isActivated === false){
          this.toast.info("Your account is not activated yet,Please contact the admin");
          this.router.navigate(['/login']);
        }
        else if (res.firstLogin) {
          this.toast.info("Change your current passsword");
          this.router.navigate(['/password-modal']);
        }
        else{
          
          this.toast.success("Login Sucessfull");
          this.router.navigate(['/profile']);
        }
      },
      error: (error) => this.toast.warning(error.message),
    });
  }
}
