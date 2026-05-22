import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './password-modal.html',
  styleUrl: './password-modal.css',
})
export class PasswordModalComponent {
  passwordForm!: FormGroup;
  @Output() passwordSubmit = new EventEmitter<string>();
  public constructor(readonly fb: FormBuilder) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['',Validators.required, Validators.minLength(8)]
    });
  }

  onSubmit() {
    if (this.passwordForm.value.password !== this.passwordForm.value.confirmPassword) {
      alert("Passwords Doesn't Match");
    }
    let password = this.passwordForm.value.password;
    console.log(password);
    this.passwordSubmit.emit(password);
  }
}
