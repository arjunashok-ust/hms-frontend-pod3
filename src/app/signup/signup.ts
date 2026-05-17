import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { timeRangeValidator } from '../validators/time-range-validator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.htm',
  styleUrl: './signup.css',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class SignUpComponent {
  signUpForm: FormGroup;

  public constructor(readonly fb: FormBuilder) {
    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.email, Validators.required]],
        roles: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        department: ['', Validators.required],
        designation: ['', Validators.required],
        status: ['', Validators.required],
        joiningDate: ['', Validators.required],
        medicalRegistrationNo: [''],
        specialization: [''],
        qualification: ['', [Validators.required]],
        consultationFee: [''],
        startHour: [''],
        endHour: [''],
        availabilitySlots: this.fb.array([]),
      },
      {
        validators: timeRangeValidator,
      },
    );
  }

  // Roles
  roles_data: any[] = [
    'Doctor',
    'Nurse',
    'Lab Tech',
    'Owner',
    'Cashier',
    'Receptionist',
    'Pharmacist',
  ];
  // Departments
  departments_data = ['OPD', 'OCD', 'ICU', 'OT'];
  // Specialization
  specializations_data = ['Cardiologist', 'Pediatrist', 'Dermatologist', 'Radiologist'];
  // Hours
  hours = Array.from({ length: 24 }, (_, i) => i);
  // Generated Slot
  generatedSlots: any[] = [];

  generateTimeSlots() {
    let startHour = Number(this.signUpForm.get('startHour')?.value);
    let endHour = Number(this.signUpForm.get('endHour')?.value);

    if (!startHour || !endHour) {
      return;
    }

    if (startHour >= endHour) {
      return;
    }

    this.generatedSlots = [];

    for (let i = startHour; i < endHour; i++) {
      this.generatedSlots.push(
        `${this.format(i)} : 00 - ${this.format(i)} : 30`,
        `${this.format(i)} : 30 - ${this.format(i + 1)} : 00`,
      );
    }
  }

  toggleSlot(slot: string) {
    const arr = this.signUpForm.get('availabilitySlots') as FormArray;
    if (arr.value.includes(slot)) {
      const index = arr.value.indexOf(slot);
      arr.removeAt(index);
    } else {
      arr.push(this.fb.control(slot));
    }
  }

  // Formatting
  format(i: number) {
    return i.toString().padStart(2, '0');
  }

  onSubmit() {
    console.log(this.signUpForm);
  }
}
