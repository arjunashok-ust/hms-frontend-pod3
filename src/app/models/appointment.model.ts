export interface AppointmentModel {
    appointmentId?: string,
    patientId: string,
    doctorEmployeeId: string,
    date: Date,
    timeSlot: string,
    status: string,
    createdByEmployeeId: string,
}

export interface AppointmentResponseModel {
    appointmentCount: number,
    cancelledCount: number,
    bookedCount: number,
    completedCount: number
}