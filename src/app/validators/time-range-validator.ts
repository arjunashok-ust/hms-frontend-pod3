import { AbstractControl, ValidationErrors } from '@angular/forms';

export function timeRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = Number(control.get('startHour')?.value);
  const end = Number(control.get('endHour')?.value);

  if (!start || !end) {
    return null;
  }

  if(start==end){
    return { sameTimeRange: true};
  }

  if (start != end && start >= end) {
    return { invalidTimeRange: true };
  }

  return null;
}

export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const inputValue = control.get('joiningDate')?.value;
  if (!inputValue) {
    return null;
  }

  let inputDate = new Date(inputValue);
  let today = new Date();
  let pastLimit = new Date();
  let futureLimit = new Date();

  futureLimit.setMonth(today.getMonth() + 6);
  pastLimit.setMonth(today.getMonth() - 6);

  if (inputDate > futureLimit || inputDate < pastLimit) {
    return { invalidJoiningDate: true };
  }

  return null;
}

export function DobValidator(control: AbstractControl): ValidationErrors | null {
  const dob = control.get('dob')?.value;
  if (!dob) {
    return null;
  }

  const date = new Date(dob);
  const today = new Date();

  if (date > today) {
    return { invalidDob: true };
  }

  return null;
}

export function appointmentDateValidator(control: AbstractControl): ValidationErrors | null {
  const inputDate = control.get('date')?.value;

  if (!inputDate) {
    return null;
  }

  const date = new Date(inputDate);
  const today = new Date();

  date.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  if (date < today) {
    return { invalidAppointmentDate: true };
  }

  return null;
}
