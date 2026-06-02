export interface UserModel {
  email: string;
  status: string;
  roles: string;
  employeeId: string;
  isVerified: boolean;
  isActivated: boolean;
  firstLogin: boolean;
}

export interface EmployeeModel {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  joiningDate: string;
  medicalRegistrationNo: string;
  specialization: string;
  qualification: string[];
  consultationFee: number;
  availabilitySlots: string[];
}

export interface UserEmployeeModel {
  employee: EmployeeModel;
}

export interface PatientModel {
  uhid: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  emergencyContact: string;
  status: string;
}