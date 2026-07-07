/**
 * @file has-permission.directive.ts
 * @description
 * This file defines a structural directive for conditionally rendering elements based on user permissions.
 *
 * @overview
 * This directive provides a declarative way to show or hide parts of the UI based on the current user's permissions.
 * It reads the required permission(s) from its input and checks them against the permissions stored in the user's JWT, which is retrieved from local storage.
 * It supports checking for any single permission from a list or requiring all of them.
 *
 * Connections:
 *   Angular Template -> HAS-PERMISSION.DIRECTIVE.TS -> localStorage -> (renders/removes embedded view)
 */
import { Directive, Input, TemplateRef, ViewContainerRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private requiredPermissions: string[] = [];
    private requireAllLogic = false;

    private readonly templateRef = inject(TemplateRef<any>);
    private readonly viewContainer = inject(ViewContainerRef);
    private readonly platformId = inject(PLATFORM_ID);

    @Input() set hasPermission(val: string | string[]) {
        this.requiredPermissions = Array.isArray(val) ? val : [val];
        this.updateView();
    }

    @Input() set hasPermissionRequireAll(val: boolean) {
        this.requireAllLogic = val;
        this.updateView();
    }

    private updateView() {
        if (this.requiredPermissions.length === 0) {
            this.viewContainer.clear();
            return;
        }

        const userPermissions = this.getUserPermissions();

        const hasAccess = this.requireAllLogic
            ? this.requiredPermissions.every(p => userPermissions.includes(p))
            : this.requiredPermissions.some(p => userPermissions.includes(p));

        if (hasAccess) {
            if (this.viewContainer.length === 0) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        } else {
            this.viewContainer.clear();
        }
    }

    private getUserPermissions(): string[] {
        if (!isPlatformBrowser(this.platformId)) {
            return [];
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return [];

            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64.replaceAll('-', '+').replaceAll('_', '/'));
            const decodedPayload = JSON.parse(decodedJson);

            return decodedPayload.permissions || [];
        } catch (error) {
            console.error('Error parsing token for permissions', error);
            return [];
        }
    }
}