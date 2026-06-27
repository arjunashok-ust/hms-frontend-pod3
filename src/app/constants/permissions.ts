export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view:dashboard',
  VIEW_EMPLOYEE: 'view:employee',
  VIEW_PROFILE: 'view:profile',
  VIEW_APPOINTMENT: 'view:appointment',
  VIEW_PATIENT: 'view:patient',
  VIEW_APPROVAL: 'view:approval',
  VIEW_MEDICAL_RECORD: 'view:medical-record',
  VIEW_APPOINTMENT_STAT: 'view:appointment-stat',
  VIEW_PATIENT_STAT: 'view:patient-stat',

  CREATE_PATIENT: 'create:patient',
  CREATE_EMPLOYEE: 'create:employee',
  CREATE_APPOINTMENT: 'create:appointment',
  CREATE_MEDICAL_RECORD: 'create:medical-record',

  DELETE_EMPLOYEE: 'delete:employee',
  DELETE_APPOINTMENT: 'delete:appointment',
  DELETE_PATIENT: 'delete:patient',
  DELETE_MEDICAL_RECORD: 'delete:medical-record',

  APPROVE_APPOINTMENT: 'approve:appointment',
  REJECT_APPOINTMENT: 'reject:appointment',
  COMPLETE_APPOINTMENT: 'complete:appointment',

  APPROVE_EMPLOYEE: 'approve:employee',

  // Admin-tier management (create/update/delete admin & super_admin) — super_admin only
  MANAGE_ADMIN: 'manage:admin',

  EDIT_APPOINTMENT: 'edit:appointment',
  EDIT_PATIENT: 'edit:patient',
  EDIT_MEDICAL_RECORD: 'edit:medical-record',
  UPDATE_FINALIZED_MEDICAL_RECORD: 'update-finalized:medical-record',
  EDIT_PROFILE: 'edit:profile',
  EDIT_EMPLOYEE: 'edit:employee',

  ROLE_MANAGE: 'role:manage',
  NODE_MANAGE: 'node:manage',
} as const;
