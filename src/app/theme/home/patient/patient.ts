import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { PatientModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { DobValidator } from '../../../validators/time-range-validator';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-patient',
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule, HasPermissionDirective, MatAutocompleteModule],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class PatientComponent implements OnInit {
  patientForm: FormGroup;

  userService: UserService = inject(UserService);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  route: Router = inject(Router);

  patientData: PatientModel[] = [];

  patientUiData = {
    patientCount: 0,
    activeCount: 0,
    inActiveCount: 0,
  };

  ngOnInit(): void {
    this.updateData();
  }

  updateData() {
    this.userService.getPatients().subscribe({
      next: (res) => {
        this.patientData = res;
        this.loadUiData();
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });
  }

  minDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d.toISOString().split('T')[0];
  }

  public constructor(readonly fb: FormBuilder) {
    this.patientForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        phone: ['', [Validators.required, Validators.pattern(/^(\+91[\s-]?)?[6789]\d{9}$/)]],
        email: [
          '',
          [Validators.required, Validators.pattern(/^[a-z0-9._]+@[a-z0-9]+\.[a-z]{2,}$/i)],
        ],
        gender: ['', [Validators.required]],
        dob: ['', [Validators.required]],
        address: ['', [Validators.required]],
        bloodGroup: ['', [Validators.required]],
        allergies: [''],
        emergencyContact: ['', [Validators.pattern(/^(\+91[\s-]?)?[6789]\d{9}$/)]],
        status: ['Active', [Validators.required]],
      },
      {
        validators: DobValidator,
      },
    );
  }

  loadUiData() {
    this.patientUiData.patientCount = this.patientData?.length || 0;

    this.patientUiData.activeCount =
      this.patientData?.filter((patient) => patient.status === 'Active').length || 0;

    this.patientUiData.inActiveCount =
      this.patientData?.filter((patient) => patient.status === 'InActive').length || 0;
  }

  deletePatient(patientId: string) {
    const payload = {
      patientId: patientId,
    };

    this.userService.deletePatient(payload).subscribe({
      next: (res) => {
        this.toast.success('Patient deleted sucessfully');
        this.updateData();
      },
      error: (error) => {
        this.toast.error('Server error during patient deletion');
      },
    });
  }

  editPatientProfile(email: string) {
    localStorage.setItem('updatePatientEmail', email);
    this.route.navigate(['edit-patient']);
    console.log(this.patientForm.errors);
  }

  onSubmit() {
    if (!this.patientForm.valid) {
      this.toast.error('Invalid input. Please check your entries and try again.');
      return;
    }

    const payload = {
      name: this.patientForm.get('name')?.value,
      role: 'Patient',
      phone: this.patientForm.get('phone')?.value,
      email: this.patientForm.get('email')?.value,
      gender: this.patientForm.get('gender')?.value,
      dob: this.patientForm.get('dob')?.value,
      address: this.patientForm.get('address')?.value,
      bloodGroup: this.patientForm.get('bloodGroup')?.value,
      allergies: this.patientForm.get('allergies')?.value,
      emergencyContact: this.patientForm.get('emergencyContact')?.value,
    };

    this.userService.createPatient(payload).subscribe({
      next: (res) => {
        this.toast.success('Patient added sucessfully');
        this.patientForm.reset({ status: 'Active' });
        this.updateData();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
