export interface AppointmentModel {
    appointmentId?: string,
    patientId: string,
    doctorEmployeeId: string,
    date: Date,
    timeSlot: string,
    status: string,
    createdByEmployeeId: string,
}