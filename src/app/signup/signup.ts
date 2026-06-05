import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { Auth } from "../services/auth";

@Component({
  selector: "app-signup",

  standalone: true,

  imports: [FormsModule, RouterLink, CommonModule],

  templateUrl: "./signup.html",

  styleUrl: "./signup.css",
})
export class Signup {
  // BASIC DETAILS

  name = "";

  email = "";

  password = "";

  phone = "";

  role = "";

  department = "";

  designation = "";

  joiningDate = "";

  // DOCTOR FIELDS

  medicalRegistrationNo = "";

  specialization = "";

  qualification = "";

  consultationFee: any = "";

  // MESSAGES

  errorMessage = "";

  successMessage = "";

  constructor(private auth: Auth, private router: Router) { }

  onSignup() {
    // RESET MESSAGES

    this.errorMessage = "";

    this.successMessage = "";

    // REQUEST BODY

    const data = {
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      role: this.role,
      department: this.department,
      designation: this.designation,
      joiningDate: this.joiningDate,
      medicalRegistrationNo: this.medicalRegistrationNo,
      specialization: this.specialization,
      qualification: this.qualification,
      consultationFee: this.consultationFee,
    };

    console.log(data);

    // API CALL

    this.auth.formSignup(data).subscribe({
      next: (response: any) => {

        console.log(response);

        alert(response.message);

        this.router.navigate(['/login']);

      },

      error: (err) => {
        console.log(err);

        let message = "Something went wrong";

        if (err.error?.errors) {
          message = err.error.errors[0].msg;
        } else if (err.error?.message) {
          message = err.error.message;
        }

        this.errorMessage = message;
      },
    });
  }
}
