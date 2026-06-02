import { Component, inject, OnInit } from '@angular/core';
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

  userService = inject(UserService);
  toast = inject(ToastrService);

  patientData: PatientModel[] = [];

  patientUiData = {
    patientCount: 0,
    activeCount: 0,
    inActiveCount: 0,
  };

  constructor(private fb: FormBuilder) {
    this.patientForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[A-Za-z ]+$/)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        email: ['', [Validators.required, Validators.email]],
        gender: ['', Validators.required],
        dob: ['', Validators.required],
        address: ['', Validators.required],
        emergencyContact: ['', [Validators.pattern(/^[0-9]{10}$/)]],
        status: ['ACTIVE'],
      },
      {
        validators: DobValidator,
      }
    );
  }

  ngOnInit(): void {
    this.updateData();
  }

  updateData(): void {
    this.userService.getPatients().subscribe({
      next: (res) => {
        this.patientData = res;
        this.loadUiData();
      },
      error: () => {
        this.toast.error('Failed to fetch patients');
      },
    });
  }

  loadUiData(): void {
    this.patientUiData.patientCount = this.patientData.length;

    this.patientUiData.activeCount =
      this.patientData.filter(p => p.status === 'ACTIVE').length;

    this.patientUiData.inActiveCount =
      this.patientData.filter(p => p.status === 'INACTIVE').length;
  }

  deletePatient(patientId: string): void {
    this.userService.deletePatient({ patientId }).subscribe({
      next: () => {
        this.toast.success('Deleted successfully');
        this.updateData();
      },
      error: () => {
        this.toast.error('Delete failed');
      },
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.toast.error('Invalid input');
      return;
    }

    this.userService.createPatient(this.patientForm.value).subscribe({
      next: () => {
        this.toast.success('Patient added');
        this.updateData();
        this.patientForm.reset({ status: 'ACTIVE' });
      },
      error: () => {
        this.toast.error('Create failed');
      },
    });
  }
}