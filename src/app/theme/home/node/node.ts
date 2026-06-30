import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../directive/has-permission.directive';
import { UserService } from '../../../services/user.service';
import { NodeModel, RoleModel } from '../../../models/ui.model';

const NODE_COLOR_MAP: string[] = ['purple', 'blue', 'green', 'rose', 'amber', 'cyan'];

@Component({
  selector: 'app-sidebar-node',
  templateUrl: 'node.html',
  styleUrls: ['node.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
})
export class NodeComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  userService: UserService = inject(UserService);
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  toast: ToastrService = inject(ToastrService);
  fb: FormBuilder = inject(FormBuilder);

  nodes: NodeModel[] = [];
  role = localStorage.getItem('role');
  roles: RoleModel[] = [];

  selectedNode: NodeModel | null = null;
  isEditing = false;
  isSaving = false;
  isDeleting = false;

  nodeForm!: FormGroup;
  nodeSearch = '';

  get totalNodes(): number {
    return this.nodes.length;
  }

  get filteredNodes(): NodeModel[] {
    const q = this.nodeSearch.trim().toLowerCase();
    const sorted = [...this.nodes].sort((a, b) => a.order - b.order);
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q),
    );
  }

  get selectedNodeRoles(): string[] {
    return this.selectedNode?.role ?? [];
  }

  ngOnInit(): void {
    this.buildForm();
    this.fetchRoles();
    this.fetchNodes();
  }

  buildForm(): void {
    this.nodeForm = this.fb.group({
      name: ['', [Validators.required]],
      path: ['', [Validators.required, Validators.pattern(/^\/[a-z0-9-/]*$/)]],
      icon: ['', [Validators.required]],
      order: [1, [Validators.required, Validators.min(1)]],
    });
  }

  fetchNodes(): void {
    this.userService.getNodes('Super Admin').subscribe({
      next: (res) => {
        this.nodes = res;
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to fetch nodes', err);
      },
    });
  }

  fetchRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (res: RoleModel[]) => {
        this.roles = res;
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to fetch roles', err);
      },
    });
  }

  openCreate(): void {
    this.selectedNode = null;
    this.isEditing = true;
    this.nodeForm.reset({ name: '', path: '', icon: '', order: this.nodes.length + 1 });
  }

  openEdit(node: NodeModel): void {
    this.selectedNode = node;
    this.isEditing = true;
    this.nodeForm.reset({
      name: node.name,
      path: node.path,
      icon: node.icon,
      order: node.order,
    });
  }

  closeForm(): void {
    this.isEditing = false;
    this.nodeForm.reset();
  }

  saveNode(): void {
    if (this.nodeForm.invalid) return;
    this.isSaving = true;

    const value = this.nodeForm.value as {
      name: string;
      path: string;
      icon: string;
      order: number;
    };

    if (this.selectedNode) {
      const payload = {
        path: value.path.trim(),
        icon: value.icon.trim(),
        order: value.order,
        role: this.selectedNode.role,
      };

      this.adminService.editNode(value.name.trim(), payload).subscribe({
        next: (updated: NodeModel) => {
          const idx = this.nodes.findIndex((n) => n.order === updated.order);
          if (idx !== -1) {
            this.nodes[idx] = updated;
            this.nodes = [...this.nodes];
          }
          this.selectedNode = updated;
          this.isSaving = false;
          this.isEditing = false;
          this.toast.success('Node', 'Updated successfully.');
          this.cd.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Failed to update node', err);
          this.isSaving = false;
        },
      });
    } else {
      const payload = {
        name: value.name.trim(),
        path: value.path.trim(),
        icon: value.icon.trim(),
        order: value.order,
        role: ['Super Admin'] as string[],
      };

      this.adminService.createNode(payload).subscribe({
        next: (created) => {
          this.nodes = [...this.nodes, created];
          this.selectedNode = created;
          this.isSaving = false;
          this.isEditing = false;
          this.toast.success('Node', 'Created successfully.');
          this.cd.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Failed to create node', err);
          this.isSaving = false;
        },
      });
    }
  }

  deleteNode(node: NodeModel): void {
    const confirmed = globalThis.confirm(`Delete the "${node.name}" node? This cannot be undone.`);
    if (!confirmed) return;

    this.isDeleting = true;
    this.adminService.deleteNode(node.name).subscribe({
      next: () => {
        this.nodes = this.nodes.filter((n) => n.order !== node.order);
        if (this.selectedNode?.order === node.order) {
          this.selectedNode = null;
          this.isEditing = false;
        }
        this.isDeleting = false;
        this.toast.success('Node', 'Deleted successfully.');
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to delete node', err);
        this.isDeleting = false;
      },
    });
  }

  selectNode(node: NodeModel): void {
    this.selectedNode = node;
    this.isEditing = false;
  }

  isRoleAssigned(node: NodeModel, roleName: string): boolean {
    return node.role.includes(roleName);
  }

  toggleRole(node: NodeModel, roleName: string): void {
    const hasRole = this.isRoleAssigned(node, roleName);
    const updatedRoles = hasRole
      ? node.role.filter((r) => r !== roleName)
      : [...node.role, roleName];

    const payload = {
      name: node.name,
      path: node.path,
      icon: node.icon,
      order: node.order,
      role: updatedRoles,
    };

    this.adminService.editNode(node.name, payload).subscribe({
      next: (updated: NodeModel) => {
        const idx = this.nodes.findIndex((n) => n.order === updated.order);
        if (idx !== -1) {
          this.nodes[idx] = updated;
          this.nodes = [...this.nodes];
        }
        if (this.selectedNode?.order === updated.order) {
          this.selectedNode = updated;
        }
        this.cd.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to update node roles', err);
      },
    });
  }

  getNodeAvatarClass(node: NodeModel): string {
    const idx = this.nodes.findIndex((n) => n.order === node.order);
    const color = NODE_COLOR_MAP[idx % NODE_COLOR_MAP.length];
    return `na-${color}`;
  }

  getRoleAvatarClass(roleName: string): string {
    const idx = this.roles.findIndex((r) => r.role_name === roleName);
    const color = NODE_COLOR_MAP[idx % NODE_COLOR_MAP.length];
    return `na-${color}`;
  }

  trackFn(_index: number, item: NodeModel): string {
    return item.name;
  }
}
