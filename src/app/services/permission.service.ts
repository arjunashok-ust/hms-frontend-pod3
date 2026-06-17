import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissions: string[] = [];

  setPermission(perms: string[]) {
    this.permissions = perms;
    localStorage.setItem('permissions', JSON.stringify(perms));
  }

  getPermission(): string[] {
    if (this.permissions.length == 0) {
      const stored = localStorage.getItem('permissions');
      if (stored) {
        this.permissions = JSON.parse(stored);
      }
    }
    return this.permissions;
  }

  hasPermission(permission: string): boolean {
    this.getPermission();
    return this.permissions.includes(permission);
  }

  hasAnyPermission(perms: string[]): boolean {
    this.getPermission();
    return perms.some((p) => this.permissions.includes(p));
  }
}
