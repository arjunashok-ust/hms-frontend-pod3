import { inject, Injectable } from '@angular/core';
import { PermissionService } from '../permission.service';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class RouteGuard implements CanActivate {
  permissionService: PermissionService = inject(PermissionService);
  permissions: string[] = [];

  toast: ToastrService = inject(ToastrService);
  router: Router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermissions = route.data['permissions'];

    console.log("user permissions : ",this.permissionService.getPermission());
    console.log("required permission : ",requiredPermissions);

    if (this.permissionService.hasAnyPermission(requiredPermissions)) {
      return true;
    }

    this.toast.error('You are not authorized to visit this page.');
    this.router.navigate(['/access-denied']);
    return false;
  }
}
