export interface UserModel{
    name: string,
    designation: string,
    email: string,
    employeeCode: string,
    status: string,
    role: string,
    lastLoginAt: string
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