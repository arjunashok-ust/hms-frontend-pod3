export interface MedicalRecordModel {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  complaint: string;
  symptoms: string;
  diagnosis: string;
  medications: Medications[];
  medicalObservations: Observations[];
  notes: string;
  createdBy: string;
  createdAt: Date;
}

export interface Medications {
  name: string;
  dosage: string;
  duration: string;
  frequency: string;
}

export interface Observations {
  metricName: string;
  metricValue: string;
  recordedAt: Date;
}
