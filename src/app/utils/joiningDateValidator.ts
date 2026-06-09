import { AbstractControl, ValidationErrors } from '@angular/forms';

export function getMinDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
}

export function getMaxDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
}

export function joiningDateValidator(
    control: AbstractControl
): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();

    const oneMonthBefore = new Date();
    oneMonthBefore.setMonth(today.getMonth() - 1);

    const oneMonthAfter = new Date();
    oneMonthAfter.setMonth(today.getMonth() + 1);

    selectedDate.setHours(0, 0, 0, 0);
    oneMonthBefore.setHours(0, 0, 0, 0);
    oneMonthAfter.setHours(0, 0, 0, 0);

    if (selectedDate < oneMonthBefore || selectedDate > oneMonthAfter) {
        return { invalidDateRange: true };
    }

    return null;
}