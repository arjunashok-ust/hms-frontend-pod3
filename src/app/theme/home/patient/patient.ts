import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { PatientModel } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { DobValidator } from '../../../validators/time-range-validator';

@Component({
  selector: 'app-patient',
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './patient.html',
  styleUrl: './patient.css',
})
export class PatientComponent implements OnInit {
  patientForm: FormGroup;

  userService: UserService = inject(UserService);
  toast: ToastrService = inject(ToastrService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  patientData: PatientModel[] | null = null;

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
      error: (error) => {
        this.toast.success('Server error during get patients');
      },
    });
  }

  public constructor(readonly fb: FormBuilder) {
    this.patientForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        phone: [
          '',
          [Validators.required, Validators.maxLength(10), Validators.pattern('^[0-9]*$')],
        ],
        email: [
          '',
          [Validators.required, Validators.pattern(/^[a-z0-9._]+@[a-z0-9]*\.[a-z]{2,}$/i)],
        ],
        gender: ['', [Validators.required]],
        dob: ['', [Validators.required]],
        address: ['', [Validators.required]],
        emergencyContact: ['', [Validators.maxLength(10), Validators.pattern('^[0-9]*$')]],
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

    this.userService.deletePatientt(payload).subscribe({
      next: (res) => {
        this.toast.success('Patient deleted sucessfully');
        this.updateData();
      },
      error: (error) => {
        this.toast.error('Server error during patient deletion');
      },
    });
  }

  onSubmit() {
    if (!this.patientForm.valid) {
      this.toast.error('Invalid input. Please check your entries and try again.');
    }
    const payload = {
      name: this.patientForm.get('name')?.value,
      phone: this.patientForm.get('phone')?.value,
      email: this.patientForm.get('email')?.value,
      gender: this.patientForm.get('gender')?.value,
      status: this.patientForm.get('status')?.value,
      dob: this.patientForm.get('dob')?.value,
      address: this.patientForm.get('address')?.value,
      emergencyContact: this.patientForm.get('emergencyContact')?.value,
    };
    this.userService.createPatient(payload).subscribe({
      next: (res) => {
        this.toast.success('Patient added sucessfully');
        this.updateData();
      },
      error: (error) => {
        console.log(error);
        this.toast.error('Server Error During Create Patient');
      },
    });
  }
}
