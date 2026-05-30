import { FormGroup, FormArray, FormControl } from '@angular/forms';

export interface GeneratedSlot {
    label: string;
    startTime: string;
    endTime: string;
}

export class TimeSlotUtil {
    static calculateHourlySlots(start: string, end: string): GeneratedSlot[] {
        if (!start || !end) return [];

        const startHour = Number.parseInt(start.split(':')[0], 10);
        const endHour = Number.parseInt(end.split(':')[0], 10);

        if (startHour >= endHour) return [];
        const generatedSubSlots: GeneratedSlot[] = [];

        for (let hour = startHour; hour < endHour; hour++) {
            const currentStart = `${hour.toString().padStart(2, '0')}:00`;
            const currentEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

            generatedSubSlots.push({
                label: `${currentStart} - ${currentEnd}`,
                startTime: currentStart,
                endTime: currentEnd
            });
        }
        return generatedSubSlots;
    }

    static populateHourlySlots(
        uniqueId: string,
        slotGroup: FormGroup,
        start: string,
        end: string,
        rowSubSlotsMap: { [key: string]: GeneratedSlot[] }
    ) {
        const checkedSlotsArray = slotGroup.get('checkedSlots') as FormArray;

        checkedSlotsArray.clear({ emitEvent: false });
        rowSubSlotsMap[uniqueId] = [];

        const generatedSubSlots = this.calculateHourlySlots(start, end);

        if (generatedSubSlots.length > 0) {
            rowSubSlotsMap[uniqueId] = generatedSubSlots;

            generatedSubSlots.forEach(() => {
                checkedSlotsArray.push(new FormControl(true), { emitEvent: false });
            });
        }
    }
}