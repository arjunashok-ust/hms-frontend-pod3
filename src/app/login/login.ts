import { Component } from "@angular/core";

import { FormsModule } from "@angular/forms";

import { Auth } from "../services/auth";

import { Router, RouterLink } from "@angular/router";

import { CommonModule } from "@angular/common";

import { ChangeDetectorRef } from "@angular/core";

@Component({//why component ?
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: "./login.html",
  styleUrl: "../login/login.css",
})

export class Login {
  email = "";
  password = "";
  errorMessage = "";
  firstLoginMessage = '';

  constructor(
    private auth: Auth,

    private router: Router,

    private cd: ChangeDetectorRef
  ) { }

  onLogin(form: any) {
    this.errorMessage = "";

    // FORM VALIDATION

    if (form.invalid) {
      this.errorMessage = "Please fill all fields correctly";

      return;
    }

    const requestBody = {
      email: this.email,

      password: this.password,
    };

    console.log(requestBody);

    this.auth.login(requestBody).subscribe({
      next: (response: any) => {
        console.log(response);

        // STORE TOKEN

        localStorage.setItem("token", response.token);

        // FIRST LOGIN

        if (response.firstLogin) {

          this.firstLoginMessage =

            response.message;

          setTimeout(() => {
            this.router.navigate([
              '/reset-password'
            ]);
          }, 1000);
          return;
        }
        // ROLE BASED REDIRECT
        if (response.user.role === "admin") {
          this.router.navigate(["/dashboard"]);
        } else if (response.user.role === "doctor") {
          this.router.navigate(["/dashboard"]);
        } else if (response.user.role === "receptionist") {
          this.router.navigate(["/dashboard"]);
        } else {
          this.router.navigate(["/dashboard"]);
        }
      },

      error: (err) => {
        console.log(err);

        this.errorMessage = err?.error?.message || "Invalid Email or Password";

        this.cd.detectChanges();
      },
    });
  }
}
