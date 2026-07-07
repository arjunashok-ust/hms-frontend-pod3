/**
 * @file node-management.ts
 * @description
 * This file defines the component for managing the application's navigation menu nodes.
 *
 * @overview
 * This component provides an administrative UI to manage the items that appear in the sidebar.
 * It allows an admin to create, edit, and delete menu nodes, as well as manage which user roles have access to each node.
 * It uses the `NodeFormComponent` for create/edit operations.
 *
 * Connections:
 *   User Interaction -> NODE-MANAGEMENT.TS -> ApiService -> HttpClient -> authInterceptor -> Backend API -> (response)
 */
import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, MenuNode } from '../../services/apiService/api-service';
import { ToastrService } from 'ngx-toastr';
import { NodeFormComponent } from '../node-form/node-form';

@Component({
  selector: 'app-node-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NodeFormComponent],
  templateUrl: './node-management.html',
  styleUrls: ['./node-management.css']
})
export class NodeManagementComponent implements OnInit {
  nodes: MenuNode[] = [];
  roles: any[] = [];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  searchQuery: string = '';
  isLoading = true;

  // View State Management
  rightPanelMode: 'EMPTY' | 'ROLES' | 'FORM' = 'EMPTY';
  selectedNode: MenuNode | null = null;

  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastrService);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchData();
    }
  }

  fetchData() {
    this.isLoading = true;

    Promise.all([
      // Pass 'true' here to fetch ALL nodes for the admin management view
      firstValueFrom(this.apiService.getMenus(true)),
      firstValueFrom(this.apiService.getAllRoles())
    ]).then(([nodesRes, rolesRes]: any) => {
      this.nodes = (nodesRes || []).sort((a: MenuNode, b: MenuNode) => (a.order || 0) - (b.order || 0));
      this.roles = rolesRes.data || [];
      this.isLoading = false;
      this.cdr.markForCheck();
    }).catch(() => {
      this.toast.error("Failed to load navigation data.");
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  get filteredNodes(): MenuNode[] {
    if (!this.searchQuery) return this.nodes;
    const term = this.searchQuery.toLowerCase();
    return this.nodes.filter(n =>
      n.name.toLowerCase().includes(term) ||
      n.path.toLowerCase().includes(term)
    );
  }

  getRoleInitials(name: string): string {
    return name.substring(0, 1).toUpperCase();
  }

  // --- Actions & Interactions ---

  openRoleAccess(node: MenuNode) {
    this.selectedNode = node;
    this.rightPanelMode = 'ROLES';
  }

  openCreateForm() {
    this.selectedNode = null;
    this.rightPanelMode = 'FORM';
  }

  openEditForm(node: MenuNode, event: Event) {
    event.stopPropagation();
    this.selectedRoleAccess(node); // Ensures node is selected
    this.rightPanelMode = 'FORM';
  }

  selectedRoleAccess(node: MenuNode) {
    this.selectedNode = node;
  }

  closeRightPanel() {
    this.rightPanelMode = 'EMPTY';
    this.selectedNode = null;
  }

  // --- Role Toggling ---

  hasRoleAccess(roleName: string): boolean {
    if (!this.selectedNode?.rolesAllowed) return false;
    return this.selectedNode.rolesAllowed.includes(roleName.toUpperCase());
  }

  toggleRoleAccess(roleName: string, isChecked: boolean) {
    if (!this.selectedNode?._id) return;

    const roleUpper = roleName.toUpperCase();
    const currentRoles = new Set(this.selectedNode.rolesAllowed?.map((r: string) => r.toUpperCase()) || []);

    if (isChecked) {
      currentRoles.add(roleUpper);
    } else {
      currentRoles.delete(roleUpper);
    }

    const updatedRoles = Array.from(currentRoles);
    this.selectedNode.rolesAllowed = updatedRoles;

    this.apiService.updateMenuNode(this.selectedNode._id, { rolesAllowed: updatedRoles }).subscribe({
      next: () => this.toast.success(`Access updated for ${this.selectedNode?.name}`),
      error: () => {
        this.toast.error("Failed to update access.");
        this.fetchData();
      }
    });
  }

  // --- Form Handlers ---

  handleSaveNode(nodeData: any) {
    if (this.selectedNode?._id) {
      // Update
      this.apiService.updateMenuNode(this.selectedNode._id, nodeData).subscribe({
        next: () => {
          this.toast.success("Node updated successfully.");
          this.fetchData();
          this.closeRightPanel();
        },
        error: () => this.toast.error("Failed to update node.")
      });
    } else {
      // Create
      this.apiService.createMenuNode(nodeData).subscribe({
        next: () => {
          this.toast.success("Node created successfully.");
          this.fetchData();
          this.closeRightPanel();
        },
        error: () => this.toast.error("Failed to create node.")
      });
    }
  }

  deleteNode(node: MenuNode, event: Event) {
    event.stopPropagation();
    if (!node._id) return;

    if (confirm(`Are you sure you want to delete the "${node.name}" node?`)) {
      this.apiService.deleteMenuNode(node._id).subscribe({
        next: () => {
          this.toast.success("Node deleted.");
          if (this.selectedNode?._id === node._id) this.closeRightPanel();
          this.fetchData();
        },
        error: () => this.toast.error("Failed to delete node.")
      });
    }
  }
}