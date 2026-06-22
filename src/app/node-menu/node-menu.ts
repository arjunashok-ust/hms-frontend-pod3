import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { PERMISSIONS } from '../constants/permissions';

@Component({
  selector: 'app-node-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  templateUrl: './node-menu.html',
  styleUrl: './node-menu.css',
})
export class NodeMenu implements OnInit {
  /* EXPOSED FOR TEMPLATE *hasPermission CHECKS */
  readonly PERMISSIONS = PERMISSIONS;

  /* 5 seeded Role documents + 4 roles referenced in Node data but not yet seeded as Role docs */
  readonly AVAILABLE_ROLES: string[] = [
    'super_admin', 'admin', 'receptionist', 'doctor', 'patient',
    'cashier', 'nurse', 'lab_Tech', 'pharmacist',
  ];

  nodes: any[] = [];
  loading = true;

  isEditMode = false;
  selectedNodeMongoId = '';

  showModal = false;
  errorMessage = '';
  successMessage = '';

  nodeForm: any = {
    node_id: null,
    name: '',
    path: '',
    role: [] as string[],
    icon: '',
  };

  constructor(readonly auth: Auth, readonly cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (globalThis.window && localStorage.getItem('token')) {
      this.loadNodes();
    }
  }

  loadNodes() {
    this.loading = true;
    this.auth.getNodes().subscribe({
      next: (response: any) => {
        this.nodes = (response.data || []).sort((a: any, b: any) => a.node_id - b.node_id);
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

  /* ROLE CHECKBOX TOGGLE */
  toggleRole(role: string) {
    const index = this.nodeForm.role.indexOf(role);
    if (index > -1) {
      this.nodeForm.role.splice(index, 1);
    } else {
      this.nodeForm.role.push(role);
    }
  }

  isRoleSelected(role: string): boolean {
    return this.nodeForm.role.includes(role);
  }

  openModal() {
    this.isEditMode = false;
    this.selectedNodeMongoId = '';
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedNodeMongoId = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetForm() {
    const maxId = this.nodes.reduce((m, n) => Math.max(m, n.node_id || 0), 0);
    this.nodeForm = { node_id: maxId + 1, name: '', path: '', role: [], icon: '' };
  }

  submitNode(form: any) {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    if (this.nodeForm.role.length === 0) {
      this.errorMessage = 'Select at least one role';
      return;
    }

    const payload = {
      node_id: this.nodeForm.node_id,
      name: this.nodeForm.name,
      path: this.nodeForm.path,
      role: this.nodeForm.role,
      icon: this.nodeForm.icon,
    };

    if (this.isEditMode) {
      this.auth.updateNode(this.selectedNodeMongoId, payload).subscribe({
        next: (response: any) => {
          this.successMessage = response.message;
          this.loadNodes();
          setTimeout(() => this.closeModal(), 1000);
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Unable To Update Node';
        },
      });
      return;
    }

    this.auth.createNode(payload).subscribe({
      next: (response: any) => {
        this.successMessage = response.message;
        this.loadNodes();
        setTimeout(() => this.closeModal(), 1000);
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Create Node';
      },
    });
  }

  editNode(node: any) {
    this.isEditMode = true;
    this.selectedNodeMongoId = node._id;
    this.nodeForm = {
      node_id: node.node_id,
      name: node.name,
      path: node.path,
      role: [...(node.role || [])],
      icon: node.icon,
    };
    this.showModal = true;
  }

  deleteNode(node: any) {
    if (!confirm(`Delete node "${node.name}"? This removes it from every user's sidebar immediately.`)) {
      return;
    }

    this.auth.deleteNode(node._id).subscribe({
      next: () => this.loadNodes(),
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Unable To Delete Node';
        this.cd.detectChanges();
      },
    });
  }
}
