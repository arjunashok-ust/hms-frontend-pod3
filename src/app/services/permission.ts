import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly permissionsSubject = new BehaviorSubject<string[]>([]);
  readonly permissions$ = this.permissionsSubject.asObservable();

  setPermissions(permissions: string[]) {
    this.permissionsSubject.next(permissions || []);
  }

  clear() {
    this.permissionsSubject.next([]);
  }

  has(permission: string): boolean {
    return this.permissionsSubject.value.includes(permission);
  }

  hasAny(permissions: string[]): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  hasAll(permissions: string[]): boolean {
    return permissions.every((permission) => this.has(permission));
  }
}
