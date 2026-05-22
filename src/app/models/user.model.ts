export interface UserModel{
    name: string,
    designation: string,
    email: string,
    employeeId: string,
    status: string,
    role: string,
    lastLoginAt: string
}

export interface EmployeeModel{
    employeeCode: string,
    name: string,
    email: string,
    department: string,
    designation: string,
    status: string,
    joiningDate: Date,
    medicalRegistrationNo: string,
    specialization: string,
    qualification: string,
    consultationFee: number,
    availabilitySlots: string[],
}

export interface UserResponseModel{
    name: string,
    email: string,
    status: string,
    role: string,
    employeeCode: string,
    isActivated: boolean,
    isVerified: boolean,
    firstLogin: boolean
}