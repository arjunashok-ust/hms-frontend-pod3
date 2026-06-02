import { Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class LoginComponent {

  loginForm: FormGroup;

  constructor(
  private fb: FormBuilder,
  private http: HttpClient,
  private router: Router
) {

    this.loginForm = this.fb.group({

      email: [
        '',
        [Validators.required, Validators.email]
      ],

      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ]

    });

  }

  onSubmit() {

    console.log("BUTTON CLICKED");

    console.log(this.loginForm.value);

    if (this.loginForm.valid) {

      console.log("SENDING REQUEST");

      this.http.post(
        'http://localhost:3000/api/auth/login',
        this.loginForm.value
      ).subscribe({

      next: (response: any) => {

  console.log("LOGIN SUCCESS");
  console.log("ROLE FROM API 👉", response.user.role);

  localStorage.setItem('token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));
  console.log("TOKEN FROM API 👉", response.token);
  console.log("FULL RESPONSE 👉", response);

  const role = response.user.role;
  localStorage.setItem('role', role);

  alert("Login Successful");

  if (role === 'Admin') {
    this.router.navigateByUrl('/dashboard');  // ✅ FIXED
  } else {
    this.router.navigateByUrl('/profile');
  }
}
,

error: (error) => {

  console.log("LOGIN FAILED");

  console.log(error);

  alert("Invalid Email or Password");

}

      });

    } else {

      console.log("FORM INVALID");

    }

  }

}