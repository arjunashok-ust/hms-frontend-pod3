import { AbstractControl, ValidationErrors } from '@angular/forms';

export function timeRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startHour')?.value;
  const end = control.get('endHour')?.value;

  if (!start || !end) return null;

  return start >= end ? { invalidTimeRange: true } : null;
}

export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.get('joiningDate')?.value;

  if (!value) return null;

  const inputDate = new Date(value);
  const now = new Date();

  const min = new Date();
  const max = new Date();

  min.setMonth(now.getMonth() - 3);
  max.setMonth(now.getMonth() + 3);

  if (inputDate < min || inputDate > max) {
    return { invalidJoiningDate: true };
  }

  return null;
}

export function appointmentDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.get('date')?.value;

  if (!value) return null;

  const selectedDate = new Date(value);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { invalidAppointmentDate: true };
  }

  return null;
}

export function DobValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.get('dob')?.value;

  if (!value) return null;

  const dob = new Date(value);
  const today = new Date();

  if (dob > today) {
    return { invalidDob: true };
  }

  return null;
}