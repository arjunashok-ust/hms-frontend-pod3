export interface LoginModel {
  email: string;
  password: string;
}

export interface SignUpModel {
  name: string;
  email: string;
  role: string;
  password: string;
  department: string;
  designation: string;
  status: string;
  joiningDate: string;
  medicalRegistrationNo: string | null;
  specialization: string | null;
  qualification: string;
  consultationFee: number | null;
  availabilitySlots: string[] | null;
}



