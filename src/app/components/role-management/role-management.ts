import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
const Users = require('../../models/users');

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

  userCanUpdatePermissions = false;
  newPermForm!: FormGroup;

  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }
  ngOnInit() {
    this.newPermForm = this.fb.group({
      action: ['', Validators.required],
      resource: ['', Validators.required]
    });

    // Chain the requests: Fetch roles first, so if permissions are empty, we have fallback data
    this.fetchRoles().then(() => {
      this.fetchPermissions();
    });

    this.userCanUpdatePermissions = this.checkUpdatePermissions();
  }

  fetchRoles(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoading = true;
      this.apiService.getAllRoles().subscribe({
        next: (res: any) => {
          this.roles = res.data || [];
          this.isLoading = false;

          if (this.roles.length > 0 && !this.selectedRole) {
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

        // --- SMART FALLBACK ---
        // If the Permissions collection in DB is empty, auto-generate the UI 
        // by extracting all existing permissions from the loaded Roles!
        if (Object.keys(permsObj).length === 0) {
          const extractedPerms = new Set<string>();
          this.roles.forEach(role => {
            if (role.rolePermissions) {
              role.rolePermissions.forEach((p: string) => extractedPerms.add(p));
            }
          });

          extractedPerms.forEach(perm => {
            const group = perm.split('_')[0]; // Extract first word (e.g., 'VIEW')
            if (!permsObj[group]) permsObj[group] = [];
            permsObj[group].push({ name: perm }); // Match expected structure
          });
        }
        // ----------------------

        this.groupedPermissions = Object.keys(permsObj)
          .sort()
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

  selectRole(role: any) {
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

  // --- Permission Toggles ---
  hasPermission(perm: string): boolean {
    return this.selectedRolePermissions.has(perm);
  }



  togglePermission(perm: string) {
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
    if (this.isGroupFullyAssigned(group)) {
      group.permissions.forEach(p => this.selectedRolePermissions.delete(p));
    } else {
      group.permissions.forEach(p => this.selectedRolePermissions.add(p));
    }
  }

  private checkUpdatePermissions(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const user = JSON.parse(userString);
          return user?.role?.rolePermissions?.includes('UPDATE_PERMISSIONS');
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
          return false;
        }
      }
    }
    return false;
  }
  // --- Saves & Actions ---
  saveRoleChanges() {
    if (!this.selectedRole) return;
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

  registerNewPermission() {
    if (this.newPermForm.invalid) {
      this.newPermForm.markAllAsTouched();
      return;
    }

    const action = this.newPermForm.value.action.trim();
    const resource = this.newPermForm.value.resource.trim();

    // Format to UPPER_SNAKE_CASE (e.g., action: "create", resource: "patient details" -> "CREATE_PATIENT_DETAILS")
    const formattedName = `${action}_${resource}`.toUpperCase().replace(/\s+/g, '_');

    this.apiService.createPermission({ name: formattedName }).subscribe({
      next: () => {
        this.toast.success(`Permission registered successfully.`);
        this.newPermForm.reset();

        // Auto-assign to current role so they don't have to search for it
        if (this.selectedRole) {
          this.selectedRolePermissions.add(formattedName);
        }

        // Re-fetch to update groups, but clear groupedPermissions to bypass the fallback
        this.groupedPermissions = [];
        this.fetchPermissions();
      },
      error: (err) => this.toast.error(err.error?.message || "Failed to register permission.")
    });
  }

  // Helper method to make UI readable (e.g., "CREATE_MEDICAL_RECORD" -> "create:medical-record")
  formatPermissionForUI(perm: string): string {
    const parts = perm.split('_');
    if (parts.length <= 1) return perm.toLowerCase();

    const action = parts[0].toLowerCase();
    const resource = parts.slice(1).join('-').toLowerCase();
    return `${action}:${resource}`;
  }
}