import { AbstractControl, ValidationErrors } from '@angular/forms';

export function timeRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startHour')?.value;
  const end = control.get('endHour')?.value;

  if(!start || !end){
    return null;
  }

  if (start != end && start >= end) {
    return { invalidTimeRange: true };
  }

  return null;
}
