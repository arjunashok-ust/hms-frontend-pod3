/**
 * @file timeSlot.ts
 * @description
 * This file provides a utility class for handling time slot calculations in forms.
 *
 * @overview
 * The `TimeSlotUtil` class contains static methods for converting between time strings and minutes, and for generating a list of 30-minute slots between a start and end time. It is used in components like `Signup` and `Employee` to manage the dynamic availability schedule forms.
 *
 * Connections:
 *   (Components with schedule forms) -> TIMESLOT.TS
 */
import { FormGroup, FormArray, FormControl } from '@angular/forms';

export interface GeneratedSlot {
  label: string;
  startTime: string;
  endTime: string;
}

export class TimeSlotUtil {
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  static calculateHalfHourSlots(start: string, end: string): GeneratedSlot[] {
    if (!start || !end) return [];

    const startMins = this.timeToMinutes(start);
    const endMins = this.timeToMinutes(end);

    if (startMins >= endMins) return [];

    const generatedSubSlots: GeneratedSlot[] = [];

    for (let current = startMins; current < endMins; current += 30) {
      const currentStart = this.minutesToTime(current);
      const currentEnd = this.minutesToTime(current + 30);

      generatedSubSlots.push({
        label: `${currentStart} - ${currentEnd}`,
        startTime: currentStart,
        endTime: currentEnd,
      });
    }

    return generatedSubSlots;
  }

  static populateHalfHourSlots(
    uniqueId: string,
    slotGroup: FormGroup,
    start: string,
    end: string,
    rowSubSlotsMap: { [key: string]: GeneratedSlot[] },
  ) {
    const checkedSlotsArray = slotGroup.get('checkedSlots') as FormArray;

    checkedSlotsArray.clear({ emitEvent: false });
    rowSubSlotsMap[uniqueId] = [];

    const generatedSubSlots = this.calculateHalfHourSlots(start, end);

    if (generatedSubSlots.length > 0) {
      rowSubSlotsMap[uniqueId] = generatedSubSlots;

      generatedSubSlots.forEach(() => {
        checkedSlotsArray.push(new FormControl(true), { emitEvent: false });
      });
    }
  }
}
