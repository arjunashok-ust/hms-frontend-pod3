import { CommonModule } from '@angular/common';

import { Component, OnInit } from '@angular/core';

import {
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormBuilder
} from '@angular/forms';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})

export class SignupComponent implements OnInit {

  signupForm: FormGroup;

  isMedicalRole = false;

  showConsultationFields = false;

  medicalRoles = [
    'Doctor',
    'Nurse',
    'Lab_tech',
    'Pharmicist'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {

    this.signupForm = this.fb.group({

      name: [
        '',
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.maxLength(6)
        ]
      ],

      phone: [
        '',
        Validators.required
      ],

      department: [''],

      designation: [''],

      role: [
        '',
        Validators.required
      ],

      status: ['Active'],

      joiningDate: [
        '',
        Validators.required
      ],

      medicalRegistrationNo: [''],

      specialization: [''],

      qualification: [''],

      consultationFee: [''],

      availabilitySlots: ['']

    });

  }

  ngOnInit(): void {

    this.signupForm
      .get('role')
      ?.valueChanges
      .subscribe((role) => {

        this.isMedicalRole =
          this.medicalRoles.includes(role);

        this.showConsultationFields =
          role === 'Doctor' ||
          role === 'Lab_tech';

        const medicalRegControl =
          this.signupForm.get(
            'medicalRegistrationNo'
          );

        if (this.isMedicalRole) {

          medicalRegControl?.setValidators([
            Validators.required
          ]);

        } else {

          medicalRegControl?.clearValidators();

          this.showConsultationFields = false;

          this.signupForm.patchValue({

            medicalRegistrationNo: '',

            specialization: '',

            qualification: '',

            consultationFee: '',

            availabilitySlots: ''

          });

        }

        medicalRegControl?.updateValueAndValidity();

      });

  }

  onsignup() {

    console.log(this.signupForm.value);

    if (this.signupForm.valid) {

      const token =
        localStorage.getItem('token');

      this.http.post(

        'http://localhost:3000/api/auth/signup',

        this.signupForm.value,

        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }

      ).subscribe({

        next: (response: any) => {

          console.log(response);

          alert("User Created Successfully");

          this.signupForm.reset();

          this.isMedicalRole = false;

          this.showConsultationFields = false;

        },

        error: (error) => {

          console.log(error);

          alert(
            error.error.message ||
            "Signup Failed"
          );

        }

      });

    } else {

      alert("Fill all required details");

    }

  }

}