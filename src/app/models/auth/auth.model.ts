export interface LoginModel {
  email: string;
  password: string;
}

export interface SignUpModel {
  name: string;
  email: string;
  roles: string[];
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

export interface RoleModel{
    role_name: string;
}

export interface DepartmentModel{
    department_name: string;
}

export interface SpecializationModel{
    specialization_name: string;
}