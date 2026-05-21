export interface RoleModel {
  role_name: string;
}

export interface DepartmentModel {
  department_name: string;
}

export interface SpecializationModel {
  specialization_name: string;
}

export interface DashboardModel {
  message: string;
  employeeCount: number;
  activeCount: number;
  pendingApprovalCount: number;
  pendingVerifyCount: number;
  patientCount: number;
  departmentCount: number;
  appointmentCount: number;
}

export interface NodeModel {
    order: number,
    name: string,
    path: string,
    role: string[],
    icon: string,
}
