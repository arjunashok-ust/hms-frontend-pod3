export interface RoleModel {
  roleName: string;
}

export interface DepartmentModel {
  departmentName: string;
}

export interface SpecializationModel {
  specializationName: string;
}

export interface DashboardModel {
  employeeCount: number;
  customerCount: number;
  departmentCount: number;
  appointmentCount: number;
  pendingApprovalCount: number;
  pendingVerifyCount: number;
  activeCount: number;
}

export interface NodeModel {
  order: number;
  name: string;
  path: string;
  role: string;
  icon: string;
}