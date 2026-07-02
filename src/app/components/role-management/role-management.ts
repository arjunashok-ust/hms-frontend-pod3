import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

interface PermissionGroup {
  groupName: string;
  permissions: string[];
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HasPermissionDirective],
  templateUrl: './role-management.html',
  styleUrls: ['./role-management.css']
})
export class RoleManagement implements OnInit {
  roles: any[] = [];
  groupedPermissions: PermissionGroup[] = [];

  selectedRole: any = null;
  selectedRolePermissions = new Set<string>();

  searchQuery: string = '';
  isLoading = true;
  isSaving = false;

  // View toggles
  isCreatingRole = false;
  userCanUpdatePermissions = false;

  newPermForm!: FormGroup;
  newRoleForm!: FormGroup;

  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) { }

  ngOnInit() {
    this.newPermForm = this.fb.group({
      action: ['', Validators.required],
      resource: ['', Validators.required]
    });

    // New Role Form Initialization
    this.newRoleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      isMedicalRole: [false]
    });

    this.fetchRoles().then(() => {
      this.fetchPermissions();
    });

    this.userCanUpdatePermissions = this.checkUserPermissionAccess();
  }

  fetchRoles(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading = true;
      this.apiService.getAllRoles().subscribe({
        next: (res: any) => {
          this.roles = res.data || [];
          this.isLoading = false;

          if (this.roles.length > 0 && !this.selectedRole && !this.isCreatingRole) {
            this.selectRole(this.roles[0]);
          }
          this.cdr.detectChanges();
          resolve();
        },
        error: (err) => {
          this.toast.error("Failed to fetch roles.");
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  fetchPermissions() {
    this.apiService.getPermissions().subscribe({
      next: (res: any) => {
        let permsObj = res.permissions || {};

        if (Object.keys(permsObj).length === 0) {
          const extractedPerms = new Set<string>();
          this.roles.forEach(role => {
            if (role.rolePermissions) {
              role.rolePermissions.forEach((p: string) => extractedPerms.add(p));
            }
          });

          extractedPerms.forEach(perm => {
            const group = perm.split('_')[0];
            if (!permsObj[group]) permsObj[group] = [];
            permsObj[group].push({ name: perm });
          });
        }

        this.groupedPermissions = Object.keys(permsObj)
          .sort((a, b) => a.localeCompare(b))
          .map(key => ({
            groupName: key,
            permissions: permsObj[key].map((p: any) => p.name).sort()
          }));

        this.cdr.detectChanges();
      },
      error: () => this.toast.error("Failed to load permissions dictionary.")
    });
  }

  get filteredGroups(): PermissionGroup[] {
    if (!this.searchQuery.trim()) return this.groupedPermissions;

    const term = this.searchQuery.toLowerCase().replace(/\s+/g, '_');
    return this.groupedPermissions.map(group => ({
      groupName: group.groupName,
      permissions: group.permissions.filter(p => p.toLowerCase().includes(term))
    })).filter(group => group.permissions.length > 0);
  }

  // Switches Right Panel to "Create Role" mode
  openCreateRoleForm() {
    this.selectedRole = null;
    this.isCreatingRole = true;
    this.newRoleForm.reset({ isMedicalRole: false });
  }

  selectRole(role: any) {
    this.isCreatingRole = false;
    this.selectedRole = role;
    this.selectedRolePermissions.clear();
    if (role.rolePermissions) {
      role.rolePermissions.forEach((p: string) => this.selectedRolePermissions.add(p));
    }
  }

  getRoleInitials(name: string): string {
    if (!name) return 'NA';
    const parts = name.split(/[\s_]+/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  hasPermission(perm: string): boolean {
    return this.selectedRolePermissions.has(perm);
  }

  togglePermission(perm: string) {
    if (!this.userCanUpdatePermissions) return;

    if (this.hasPermission(perm)) {
      this.selectedRolePermissions.delete(perm);
    } else {
      this.selectedRolePermissions.add(perm);
    }
  }

  isGroupFullyAssigned(group: PermissionGroup): boolean {
    if (group.permissions.length === 0) return false;
    return group.permissions.every(p => this.hasPermission(p));
  }

  toggleGroup(group: PermissionGroup) {
    if (!this.userCanUpdatePermissions) return;

    if (this.isGroupFullyAssigned(group)) {
      group.permissions.forEach(p => this.selectedRolePermissions.delete(p));
    } else {
      group.permissions.forEach(p => this.selectedRolePermissions.add(p));
    }
  }

  private getStoredUserPermissions(): string[] {
    if (!isPlatformBrowser(this.platformId)) return [];

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
        const decodedPayload = JSON.parse(decodedJson);
        return Array.isArray(decodedPayload.permissions) ? decodedPayload.permissions : [];
      } catch (error) {
        console.error('Error parsing token', error);
      }
    }
    return [];
  }

  private checkUserPermissionAccess(): boolean {
    const permissions = new Set(this.getStoredUserPermissions().map(permission => permission.toUpperCase()));
    return permissions.has('UPDATE_PERMISSIONS') || permissions.has('DELETE_PERMISSIONS');
  }

  saveRoleChanges() {
    if (!this.selectedRole || !this.userCanUpdatePermissions) return;
    this.isSaving = true;

    const payload = {
      roleName: this.selectedRole.roleName,
      rolePermissions: Array.from(this.selectedRolePermissions)
    };

    this.apiService.updateRole(this.selectedRole._id, payload).subscribe({
      next: (res: any) => {
        this.toast.success(`${this.selectedRole.roleName} updated successfully.`);
        this.selectedRole.rolePermissions = payload.rolePermissions;
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.error?.message || "Failed to update role.");
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- NEW: Submit New Role Form ---
  submitNewRole() {
    if (this.newRoleForm.invalid) {
      this.newRoleForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.newRoleForm.value; // { roleName: '...', isMedicalRole: true/false }

    this.apiService.createRole(payload).subscribe({
      next: (res: any) => {
        this.toast.success(`Role ${res.data.roleName} created successfully.`);
        this.isSaving = false;
        this.newRoleForm.reset({ isMedicalRole: false });

        // Refresh the list and select the newly created role
        this.fetchRoles().then(() => {
          const newlyCreated = this.roles.find(r => r.roleName === res.data.roleName);
          if (newlyCreated) {
            this.selectRole(newlyCreated);
          }
        });
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || "Failed to create role.");
        this.isSaving = false;
      }
    });
  }

  registerNewPermission() {
    if (this.newPermForm.invalid) {
      this.newPermForm.markAllAsTouched();
      return;
    }

    const action = this.newPermForm.value.action.trim();
    const resource = this.newPermForm.value.resource.trim();
    const formattedName = `${action}_${resource}`.toUpperCase().replace(/\s+/g, '_');

    this.apiService.createPermission({ name: formattedName }).subscribe({
      next: () => {
        this.toast.success(`Permission registered successfully.`);
        this.newPermForm.reset();

        if (this.selectedRole) {
          this.selectedRolePermissions.add(formattedName);
        }

        this.groupedPermissions = [];
        this.fetchPermissions();
      },
      error: (err) => this.toast.error(err.error?.message || "Failed to register permission.")
    });
  }

  formatPermissionForUI(perm: string): string {
    const parts = perm.split('_');
    if (parts.length <= 1) return perm.toLowerCase();

    const action = parts[0].toLowerCase();
    const resource = parts.slice(1).join('-').toLowerCase();
    return `${action}:${resource}`;
  }
}