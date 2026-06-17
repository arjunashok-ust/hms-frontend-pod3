import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
})
export class HasPermissionDirective {
  permissionService: PermissionService = inject(PermissionService);
  templateRef = inject(TemplateRef);
  viewContainer = inject(ViewContainerRef);

  @Input() set hasPermission(perms: string[]) {
    const hasAccess: boolean = this.permissionService.hasAnyPermission(perms);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
