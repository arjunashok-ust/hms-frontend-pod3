import { Directive, Input, TemplateRef, ViewContainerRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private requiredPermissions: string[] = [];
    private requireAllLogic = false;

    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);
    private platformId = inject(PLATFORM_ID);

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