export interface UserModel {
  email: string;
  status: string;
  role: string;
  employeeId: string;
  isVerified: boolean;
  firstLogin: boolean;
}

export interface EmployeeModel {
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: Date;
  medicalRegistrationNo: string;
  specialization: string;
  qualification: string;
  consultationFee: number;
  availabilitySlots: string[];
}

export interface UserEmployeeModel {
  name: string;
  email: string;
  status: string;
  role: string;
  employeeId: string;
  isVerified: boolean;
  firstLogin: boolean;
  department: string;
  designation: string;
  joiningDate: Date;
  medicalRegistrationNo: string;
  specialization: string;
  qualification: string;
  consultationFee: number;
  availabilitySlots: string[];
}

export interface PatientModel {
  uhid: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: Date;
  bloodGroup: string;
  allergies: string;
  address: string;
  emergencyContact: string;
  status: string;
}

export interface RoleResponseModel {
  _id: RoleId;
  role_id: number;
  role_name: string;
  role_permissions: string[];
}

interface RoleId {
  $oid: string;
}
