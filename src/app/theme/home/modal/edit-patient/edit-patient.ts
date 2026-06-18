import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { PatientModel } from '../../../../models/user.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  futureDateValidator,
  timeRangeValidator,
} from '../../../../validators/time-range-validator';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-edit-patient',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './edit-patient.html',
  styleUrl: './edit-patient.css',
})
export class EditPatientComponent implements OnInit {
  userService: UserService = inject(UserService);
  router: Router = inject(Router);
  toast: ToastrService = inject(ToastrService);

  isLoading: boolean = false;

  cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  updateForm: FormGroup;

  patientData: PatientModel | null = null;
  minDate: string = '';
  maxDate: string = '';

  public constructor(readonly fb: FormBuilder) {
    this.updateForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(/^[a-z]+( [a-z]+)*$/i)]],
        phone: [
          { value: '', disabled: true },
          [(Validators.required, Validators.pattern(/^(\+91[\s-]?)?[6789]\d{9}$/))],
        ],
        email: [
          { value: '', disabled: true },
          [
            Validators.email,
            Validators.required,
            Validators.pattern(/^[a-z0-9._]+@[a-z0-9]+\.[a-z]{2,}$/i),
          ],
        ],
        gender: ['', Validators.required],
        dob: ['', Validators.required],
        address: ['', Validators.required],
        bloodGroup: ['', Validators.required],
        allergies: [''],
        emergencyContact: ['', [Validators.pattern(/^(\+91[\s-]?)?[6789]\d{9}$/)]],
      },
      {
        validators: [timeRangeValidator, futureDateValidator],
      },
    );
  }

  ngOnInit(): void {
    const userEmail = localStorage.getItem('updatePatientEmail') ?? '';

    this.userService.getPatientProfile(userEmail).subscribe({
      next: (res) => {
        console.log(res);
        this.patientData = res;
        this.updateForm.patchValue({
          name: this.patientData?.name,
          phone: this.patientData?.phone,
          email: this.patientData?.email,
          gender: this.patientData?.gender,
          dob: new Date(this.patientData?.dob).toISOString().slice(0, 10),
          address: this.patientData?.address,
          bloodGroup: this.patientData?.bloodGroup,
          allergies: this.patientData?.allergies,
          emergencyContact: this.patientData.emergencyContact,
        });
        this.cd.detectChanges();
      },
      error: (err) => {
        this.toast.error(err?.error?.message);
      },
    });

    const min = new Date();
    const max = new Date();

    min.setFullYear(min.getFullYear() - 120);

    this.minDate = min.toISOString().slice(0, 10);
    this.maxDate = max.toISOString().slice(0, 10);
  }

  onSubmit() {
    if (this.updateForm.invalid) {
      this.toast.error('Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;

    const payload = {
      patientId: this.patientData?.uhid,
      name: this.updateForm.get('name')?.value,
      gender: this.updateForm.get('gender')?.value,
      dob: this.updateForm.get('dob')?.value,
      address: this.updateForm.get('address')?.value,
      bloodGroup: this.updateForm.get('bloodGroup')?.value,
      allergies: this.updateForm.get('allergies')?.value,
      emergencyContact: this.updateForm.get('emergencyContact')?.value,
    };

    this.userService.updatePatientProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toast.success(res.message);
        this.router.navigate(['/patient']);
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err?.error?.message || err?.message || 'Something went wrong!');
      },
    });
  }
}
