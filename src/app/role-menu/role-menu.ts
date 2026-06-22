import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';

@Component({
  selector: 'app-role-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './role-menu.html',
  styleUrl: './role-menu.css',
})
export class RoleMenu implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  /* PERMISSION CHECKBOXES, GROUPED FOR READABILITY — same 28 constants as constants/permissions.ts */
  readonly PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
    {
      label: 'View',
      permissions: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_EMPLOYEE,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.VIEW_APPOINTMENT,
        PERMISSIONS.VIEW_PATIENT,
        PERMISSIONS.VIEW_APPROVAL,
        PERMISSIONS.VIEW_MEDICAL_RECORD,
        PERMISSIONS.VIEW_APPOINTMENT_STAT,
        PERMISSIONS.VIEW_PATIENT_STAT,
      ],
    },
    {
      label: 'Create',
      permissions: [
        PERMISSIONS.CREATE_PATIENT,
        PERMISSIONS.CREATE_EMPLOYEE,
        PERMISSIONS.CREATE_APPOINTMENT,
        PERMISSIONS.CREATE_MEDICAL_RECORD,
      ],
    },
    {
      label: 'Edit',
      permissions: [
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.EDIT_EMPLOYEE,
        PERMISSIONS.EDIT_PATIENT,
        PERMISSIONS.EDIT_APPOINTMENT,
        PERMISSIONS.EDIT_MEDICAL_RECORD,
        PERMISSIONS.UPDATE_FINALIZED_MEDICAL_RECORD,
      ],
    },
    {
      label: 'Delete',
      permissions: [
        PERMISSIONS.DELETE_EMPLOYEE,
        PERMISSIONS.DELETE_APPOINTMENT,
        PERMISSIONS.DELETE_PATIENT,
        PERMISSIONS.DELETE_MEDICAL_RECORD,
      ],
    },
    {
      label: 'Workflow',
      permissions: [
        PERMISSIONS.APPROVE_APPOINTMENT,
        PERMISSIONS.REJECT_APPOINTMENT,
        PERMISSIONS.COMPLETE_APPOINTMENT,
        PERMISSIONS.APPROVE_EMPLOYEE,
      ],
    },
    {
      label: 'Admin',
      permissions: [
        PERMISSIONS.ROLE_MANAGE,
        PERMISSIONS.NODE_MANAGE,
      ],
    },
  ];

  roles: any[] = [];
  loading = true;

  isEditMode = false;
  selectedRoleMongoId = '';

  showModal = false;
  errorMessage = '';
  successMessage = '';

  roleForm: any = {
    role_id: null,
    role_name: '',
    role_permissions: [] as string[],
  };

  constructor(readonly auth: Auth, readonly cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (globalThis.window && localStorage.getItem('token')) {
      this.loadRoles();
    }
  }

  loadRoles() {
    this.loading = true;
    this.auth.getRoles().subscribe({
      next: (response: any) => {
        this.roles = (response.data || []).sort((a: any, b: any) => a.role_id - b.role_id);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.log(err);
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }

  /* PERMISSION CHECKBOX TOGGLE */
  togglePermission(permission: string) {
    const index = this.roleForm.role_permissions.indexOf(permission);
    if (index > -1) {
      this.roleForm.role_permissions.splice(index, 1);
    } else {
      this.roleForm.role_permissions.push(permission);
    }
  }

  isPermissionSelected(permission: string): boolean {
    return this.roleForm.role_permissions.includes(permission);
  }

  /* SELECT/CLEAR AN ENTIRE GROUP AT ONCE */
  toggleGroup(permissions: string[]) {
    const allSelected = permissions.every((p) => this.isPermissionSelected(p));
    if (allSelected) {
      this.roleForm.role_permissions = this.roleForm.role_permissions.filter(
        (p: string) => !permissions.includes(p),
      );
    } else {
      permissions.forEach((p) => {
        if (!this.isPermissionSelected(p)) {
          this.roleForm.role_permissions.push(p);
        }
      });
    }
  }

  isGroupFullySelected(permissions: string[]): boolean {
    return permissions.every((p) => this.isPermissionSelected(p));
  }

  openModal() {
    this.isEditMode = false;
    this.selectedRoleMongoId = '';
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedRoleMongoId = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetForm() {
    const maxId = this.roles.reduce((m, r) => Math.max(m, r.role_id || 0), 0);
    this.roleForm = { role_id: maxId + 1, role_name: '', role_permissions: [] };
  }

  submitRole(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    const payload = {
      role_id: this.roleForm.role_id,
      role_name: this.roleForm.role_name,
      role_permissions: this.roleForm.role_permissions,
    };

    if (this.isEditMode) {
      this.auth.updateRole(this.selectedRoleMongoId, payload).subscribe({
        next: (response: any) => {
          this.successMessage = response.message;
          this.loadRoles();
          setTimeout(() => this.closeModal(), 1000);
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Unable To Update Role';
        },
      });
      return;
    }

    this.auth.createRole(payload).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.loadRoles();
        setTimeout(() => this.closeModal(), 1000);
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Create Role';
      },
    });
  }

  editRole(role: any) {
    this.isEditMode = true;
    this.selectedRoleMongoId = role._id;
    this.roleForm = {
      role_id: role.role_id,
      role_name: role.role_name,
      role_permissions: [...(role.role_permissions || [])],
    };
    this.showModal = true;
  }

  deleteRole(role: any) {
    if (!confirm(`Delete role "${role.role_name}"? Any user currently assigned this role will fail every permission check immediately.`)) {
      return;
    }

    this.auth.deleteRole(role._id).subscribe({
      next: () => this.loadRoles(),
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Delete Role';
        this.cd.detectChanges();
      },
    });
  }
}
