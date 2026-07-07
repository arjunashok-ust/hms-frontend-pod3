/**
 * @file joiningDateValidator.ts
 * @description
 * This file provides utility functions and a custom validator for handling date inputs in reactive forms.
 *
 * @overview
 * This module exports helper functions (`getMinDate`, `getMaxDate`) to define a valid date range and a custom `joiningDateValidator` for Angular's `FormBuilder`. The validator ensures that a selected date falls within a specific range (one month before to one month after the current date).
 *
 * Connections:
 *   (Component Form Definitions) -> JOININGDATEVALIDATOR.TS
 */
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