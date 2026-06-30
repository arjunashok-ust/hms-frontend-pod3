import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';

interface RoleId {
  $oid: string;
}

interface Role {
  _id: RoleId;
  role_id: number;
  role_name: string;
  role_permissions: string[];
}

interface PermissionGroup {
  key: string;
  permissions: string[];
}

const GROUP_COLOR_MAP: Record<string, string> = {
  view: 'purple',
  create: 'green',
  edit: 'blue',
  delete: 'rose',
  approve: 'amber',
  reject: 'rose',
  complete: 'cyan',
  cancel: 'amber',
};

const ROLE_COLOR_MAP: string[] = ['purple', 'blue', 'green', 'rose', 'amber', 'cyan'];

@Component({
  selector: 'app-permissions',
  templateUrl: './permission.html',
  styleUrls: ['./permission.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
})
export class PermissionComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);

  roles: Role[] = [];
  selectedRole: Role | null = null;

  currentPermissions: string[] = [];
  originalPermissions: string[] = [];

  allPermissions: string[] = [];

  permSearch = '';
  newPermForm!: FormGroup;

  isCreating = false;
  isSaving = false;

  get totalPermissions(): number {
    return this.allPermissions.length;
  }

  get pendingAdd(): string[] {
    return this.currentPermissions.filter((p) => !this.originalPermissions.includes(p));
  }

  get pendingRemove(): string[] {
    return this.originalPermissions.filter((p) => !this.currentPermissions.includes(p));
  }

  get hasPendingChanges(): boolean {
    return this.pendingAdd.length > 0 || this.pendingRemove.length > 0;
  }

  get allGroups(): PermissionGroup[] {
    const map = new Map<string, string[]>();
    for (const perm of this.allPermissions) {
      const key = perm.split(':')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(perm);
    }
    return Array.from(map.entries()).map(([key, permissions]) => ({ key, permissions }));
  }

  get filteredGroups(): PermissionGroup[] {
    const q = this.permSearch.trim().toLowerCase();
    if (!q) return this.allGroups;
    return this.allGroups
      .map((g) => ({
        key: g.key,
        permissions: g.permissions.filter((p) => p.toLowerCase().includes(q)),
      }))
      .filter((g) => g.permissions.length > 0);
  }

  constructor(
    readonly fb: FormBuilder,
    readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.newPermForm = this.fb.group({
      action: ['', [Validators.required, Validators.pattern(/^[a-z]+$/)]],
      resource: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    });
    this.fetchRoles();
  }

  fetchRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (res) => {
        this.roles = res;
        this.buildAllPermissions();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch roles', err);
      },
    });
  }

  buildAllPermissions(): void {
    const set = new Set<string>();
    for (const role of this.roles) {
      for (const perm of role.role_permissions) {
        set.add(perm);
      }
    }
    this.allPermissions = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  selectRole(role: Role): void {
    if (this.hasPendingChanges) {
      const confirm = globalThis.confirm('You have unsaved changes. Discard them and switch role?');
      if (!confirm) return;
    }
    this.selectedRole = role;
    this.originalPermissions = [...new Set(role.role_permissions)];
    this.currentPermissions = [...this.originalPermissions];
    this.permSearch = '';
  }

  isAssigned(perm: string): boolean {
    return this.currentPermissions.includes(perm);
  }

  togglePermission(perm: string): void {
    if (this.isAssigned(perm)) {
      this.currentPermissions = this.currentPermissions.filter((p) => p !== perm);
    } else {
      this.currentPermissions = [...this.currentPermissions, perm].sort((a, b) =>
        a.localeCompare(b),
      );
    }
  }

  isGroupFullyAssigned(groupKey: string): boolean {
    const group = this.allGroups.find((g) => g.key === groupKey);
    if (!group) return false;
    return group.permissions.every((p) => this.isAssigned(p));
  }

  toggleGroup(groupKey: string): void {
    const group = this.allGroups.find((g) => g.key === groupKey);
    if (!group) return;
    if (this.isGroupFullyAssigned(groupKey)) {
      this.currentPermissions = this.currentPermissions.filter(
        (p) => !group.permissions.includes(p),
      );
    } else {
      const toAdd = group.permissions.filter((p) => !this.isAssigned(p));
      this.currentPermissions = [...this.currentPermissions, ...toAdd].sort((a, b) =>
        a.localeCompare(b),
      );
    }
  }

  saveChanges(): void {
    if (!this.selectedRole || !this.hasPendingChanges) return;
    this.isSaving = true;

    const payload = {
      role_name: this.selectedRole.role_name,
      role_permissions: this.currentPermissions,
    };

    this.adminService.updateRole(payload).subscribe({
      next: (updated) => {
        const idx = this.roles.findIndex((r) => r._id.$oid === this.selectedRole!._id.$oid);
        if (idx !== -1) {
          this.roles[idx] = updated;
          this.roles = [...this.roles];
        }
        this.selectedRole = updated;
        this.originalPermissions = [...new Set(updated.role_permissions as string[])];
        this.currentPermissions = [...this.originalPermissions];
        this.buildAllPermissions();

        this.toast.success('Role', 'Updated sucessfully.');
        this.isSaving = false;

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save permissions', err);
        this.isSaving = false;
      },
    });
  }

  discardChanges(): void {
    this.currentPermissions = [...this.originalPermissions];
  }

  createPermission(): void {
    if (this.newPermForm.invalid) return;
    const { action, resource } = this.newPermForm.value as { action: string; resource: string };
    const slug = `${action.trim()}:${resource.trim()}`;

    if (this.allPermissions.includes(slug)) {
      alert(`Permission "${slug}" already exists.`);
      return;
    }

    this.isCreating = true;
    this.allPermissions = [...this.allPermissions, slug];

    const payload = {
      role_name: 'Super Admin',
      role_permissions: this.allPermissions,
    };

    this.adminService.updateRole(payload).subscribe({
      next: () => {
        this.allPermissions.sort((a, b) => a.localeCompare(b));
        this.newPermForm.reset();
        this.isCreating = false;

        this.toast.success('Permission Added successfully.');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create permission', err);
        this.isCreating = false;
      },
    });
  }

  getRoleAvatarClass(roleName: string): string {
    const idx = this.roles.findIndex((r) => r.role_name === roleName);
    const color = ROLE_COLOR_MAP[idx % ROLE_COLOR_MAP.length];
    return `ra-${color}`;
  }

  getGroupDotClass(groupKey: string): string {
    const color = GROUP_COLOR_MAP[groupKey] ?? 'purple';
    return `gd-${color}`;
  }

  trackFn(_index: number, item: Role): string {
    return item._id.$oid;
  }
}
