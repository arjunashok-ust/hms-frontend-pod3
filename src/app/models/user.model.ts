export interface UserModel {
  name: string;
  designation: string;
  email: string;
  employeeCode: string;
  status: string;
  role: string;
  lastLoginAt: string;
}

export interface EmployeeModel {
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  joiningDate: Date;
  medicalRegistrationNo: string;
  specialization: string;
  qualification: string;
  consultationFee: number;
  availabilitySlots: string[];
}

export interface UserResponseModel {
  email: string;
  status: string;
  role: string;
  employeeId: string;
  isActivated: boolean;
  isVerified: boolean;
  firstLogin: boolean;
  lastLoginAt: boolean;
}

export interface PatientModel {
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: Date;
  address: string;
  emergencyContact: string;
  status: string;
  uhid: string;
}
