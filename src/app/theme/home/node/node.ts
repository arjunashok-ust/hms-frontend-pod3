import { Component, inject, OnInit, signal } from '@angular/core';
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
  toast: ToastrService = inject(ToastrService);
  fb: FormBuilder = inject(FormBuilder);

  nodes = signal<NodeModel[]>([]);
  role = signal(localStorage.getItem('role'));
  roles = signal<RoleModel[]>([]);

  selectedNode = signal<NodeModel | null>(null);
  isEditing = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);

  nodeForm!: FormGroup;
  nodeSearch = signal('');

  get totalNodes(): number {
    return this.nodes().length;
  }

  get filteredNodes(): NodeModel[] {
    const q = this.nodeSearch().trim().toLowerCase();
    const sorted = [...this.nodes()].sort((a, b) => a.order - b.order);
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q),
    );
  }

  get selectedNodeRoles(): string[] {
    return this.selectedNode()?.role ?? [];
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
        this.nodes.set(res);
      },
      error: (err: unknown) => {
        console.error('Failed to fetch nodes', err);
      },
    });
  }

  fetchRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (res: RoleModel[]) => {
        this.roles.set(res);
      },
      error: (err: unknown) => {
        console.error('Failed to fetch roles', err);
      },
    });
  }

  openCreate(): void {
    this.selectedNode.set(null);
    this.isEditing.set(true);
    this.nodeForm.reset({ name: '', path: '', icon: '', order: this.nodes.length + 1 });
  }

  openEdit(node: NodeModel): void {
    this.selectedNode.set(node);
    this.isEditing.set(true);
    this.nodeForm.reset({
      name: node.name,
      path: node.path,
      icon: node.icon,
      order: node.order,
    });
  }

  closeForm(): void {
    this.isEditing.set(false);
    this.nodeForm.reset();
  }

  saveNode(): void {
    if (this.nodeForm.invalid) return;
    this.isSaving.set(true);

    const value = this.nodeForm.value as {
      name: string;
      path: string;
      icon: string;
      order: number;
    };

    if (this.selectedNode()) {
      const payload = {
        path: value.path.trim(),
        icon: value.icon.trim(),
        order: value.order,
        role: this.selectedNode()?.role,
      };

      this.adminService.editNode(value.name.trim(), payload).subscribe({
        next: (updated: NodeModel) => {
          const idx = this.nodes().findIndex((n) => n.name === updated.name);
          if (idx !== -1) {
            this.nodes.update((nodes) => nodes.map((node, i) => (i === idx ? updated : node)));
          }
          this.selectedNode.set(updated);
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.toast.success('Node', 'Updated successfully.');
        },
        error: (err: unknown) => {
          console.error('Failed to update node', err);
          this.isSaving.set(false);
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
          this.nodes.update((nodes) => [...nodes, created]);
          this.selectedNode.set(created);
          this.isSaving.set(false);
          this.isEditing.set(false);
          this.toast.success('Node', 'Created successfully.');
        },
        error: (err: unknown) => {
          console.error('Failed to create node', err);
          this.isSaving.set(false);
        },
      });
    }
  }

  deleteNode(node: NodeModel): void {
    const confirmed = globalThis.confirm(`Delete the "${node.name}" node? This cannot be undone.`);
    if (!confirmed) return;

    this.isDeleting.set(true);
    this.adminService.deleteNode(node.name).subscribe({
      next: () => {
        this.nodes.set(this.nodes().filter((n) => n.name !== node.name));
        if (this.selectedNode()?.name === node.name) {
          this.selectedNode.set(null);
          this.isEditing.set(false);
        }
        this.isDeleting.set(false);
        this.toast.success('Node', 'Deleted successfully.');
      },
      error: (err: unknown) => {
        console.error('Failed to delete node', err);
        this.isDeleting.set(false);
      },
    });
  }

  selectNode(node: NodeModel): void {
    this.selectedNode.set(node);
    this.isEditing.set(false);
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
        const idx = this.nodes().findIndex((n) => n.name === updated.name);
        if (idx !== -1) {
          this.nodes.update((nodes) => nodes.map((nodes, i) => (i === idx ? updated : nodes)));
        }
        if (this.selectedNode()?.name === updated.name) {
          this.selectedNode.set(updated);
        }
      },
      error: (err: unknown) => {
        console.error('Failed to update node roles', err);
      },
    });
  }

  getNodeAvatarClass(node: NodeModel): string {
    const idx = this.nodes().findIndex((n) => n.name === node.name);
    const color = NODE_COLOR_MAP[idx % NODE_COLOR_MAP.length];
    return `na-${color}`;
  }

  getRoleAvatarClass(roleName: string): string {
    const idx = this.roles().findIndex((r) => r.role_name === roleName);
    const color = NODE_COLOR_MAP[idx % NODE_COLOR_MAP.length];
    return `na-${color}`;
  }

  trackFn(_index: number, item: NodeModel): string {
    return item.name;
  }
}
