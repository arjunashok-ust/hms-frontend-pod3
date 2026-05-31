import { AbstractControl, ValidationErrors } from '@angular/forms';

export function timeRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startHour')?.value;
  const end = control.get('endHour')?.value;

  if (!start || !end) {
    return null;
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

  futureLimit.setMonth(today.getMonth() + 3);
  pastLimit.setMonth(today.getMonth() - 3);

  if (inputDate > futureLimit || inputDate < pastLimit) {
    return { invalidJoiningDate: true };
  }

  return null;
}

export function DobValidator(control: AbstractControl): ValidationErrors | null {
  const dob = control.get('dob')?.value;
  if(!dob){
    return null;
  }
  const date = new Date(dob);
  const today = new Date();

  if(date>today){
    return {invalidDob: true};
  }

  return null;
}
