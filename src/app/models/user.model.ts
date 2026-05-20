export interface UserModel{
    name: string,
    designation: string,
    email: string,
    employeeId: string,
    status: string,
    roles: string,
    lastLoginAt: string
}

export interface UserResponseModel{
    email: string,
    status: string,
    roles: string[],
    employeeId: string,
    isActivated: boolean,
    isVerified: boolean,
    firstLogin: boolean
}