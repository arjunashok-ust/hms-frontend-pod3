import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-signup',

  standalone: true,

  imports: [FormsModule, RouterLink, CommonModule],

  templateUrl: './signup.html',

  styleUrl: './signup.css',
})
export class Signup {
  // BASIC DETAILS
  name = '';
  email = '';
  password = '';
  phone = '';
  role = '';
  department = '';
  designation = '';
  joiningDate = '';
  // DOCTOR FIELDS
  medicalRegistrationNo = '';
  specialization = '';
  qualification = '';
  consultationFee: any = '';

  /* SLOT DATA */

  hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  generatedSlots: string[] = [];
  availabilitySlots: string[] = [];

  startHour = '';

  endHour = '';

  minJoiningDate = '';
  maxJoiningDate = '';
  // MESSAGES

  errorMessage = '';

  successMessage = '';

  constructor(
    readonly auth: Auth,
    readonly router: Router,
  ) {
    const today = new Date();

    const minDate = new Date(today);
    minDate.setMonth(today.getMonth() - 6);

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);

    this.minJoiningDate = minDate.toISOString().split('T')[0];
    this.maxJoiningDate = maxDate.toISOString().split('T')[0];
  }
  generateTimeSlots() {
    const startHour = Number(this.startHour);

    const endHour = Number(this.endHour);

    if (startHour >= endHour) {
      alert('Start hour must be less than end hour');

      return;
    }

    this.generatedSlots = [];

    for (let i = startHour; i < endHour; i++) {
      this.generatedSlots.push(
        `${this.formatHour(i)} - ${this.formatHourHalf(i)}`,

        `${this.formatHourHalf(i)} - ${this.formatHour(i + 1)}`,
      );
    }
  }

  toggleSlot(slot: string) {
    const index = this.availabilitySlots.indexOf(slot);

    if (index > -1) {
      this.availabilitySlots.splice(index, 1);
    } else {
      this.availabilitySlots.push(slot);
    }
  }

  isSlotSelected(slot: string) {
    return this.availabilitySlots.includes(slot);
  }

  formatHour(hour: number) {
    const period = hour >= 12 ? 'PM' : 'AM';

    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:00 ${period}`;
  }

  formatHourHalf(hour: number) {
    const period = hour >= 12 ? 'PM' : 'AM';

    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:30 ${period}`;
  }

  onSignup() {
    // RESET MESSAGES

    this.errorMessage = '';

    this.successMessage = '';

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
      availabilitySlots: this.availabilitySlots,
    };

    console.log(data);

    // API CALL

    this.auth.formSignup(data).subscribe({
      next: (response: any) => {
        console.log(response);

        alert(response.message);

        //Making all the fields Empty
        this.name = '';
        this.email = '';
        this.password = '';
        this.phone = '';
        this.role = '';
        this.department = '';
        this.designation = '';
        this.joiningDate = '';

        this.medicalRegistrationNo = '';
        this.specialization = '';
        this.qualification = '';
        this.consultationFee = '';

        // RESET SLOTS

        this.availabilitySlots = [];
        this.generatedSlots = [];
        this.startHour = '';
        this.endHour = '';

        this.router.navigate(['/login']);
      },

      error: (err) => {
        console.log(err);

        let message = 'Something went wrong';

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
