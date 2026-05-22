import { AppointmentModel } from "../../models/appointment.model";

export function mapToAppointmentRequest(form: any) : AppointmentModel {
  return {
    patientId: form.value.patientId,
    doctorEmployeeId: form.value.doctorEmployeeId,
    date: form.value.date,
    timeSlot: form.value.timeSlot,
    status: form.value.status,
    createdByEmployeeId: form.value.createdByEmployeeId,
  };
}
