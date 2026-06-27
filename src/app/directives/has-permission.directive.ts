import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../services/permission';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnDestroy {
  private requiredPermissions: string[] = [];
  private hasView = false;
  private readonly subscription: Subscription;

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly permissionService: PermissionService,
  ) {
    this.subscription = this.permissionService.permissions$.subscribe(() => this.updateView());
  }

  @Input() set hasPermission(value: string | string[]) {
    this.requiredPermissions = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  private updateView() {
    const allowed =
      this.requiredPermissions.length > 0 && this.permissionService.hasAny(this.requiredPermissions);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
