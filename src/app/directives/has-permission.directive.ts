import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective {
    private requiredPermissions: string[] = [];
    private requireAllLogic = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef
    ) { }

    // 1. Accept either a single string or an array of strings
    @Input() set hasPermission(val: string | string[]) {
        this.requiredPermissions = Array.isArray(val) ? val : [val];
        this.updateView();
    }

    // 2. Optional flag to enforce AND logic instead of OR logic
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

        // 3. Evaluate permissions based on the chosen logic
        const hasAccess = this.requireAllLogic
            ? this.requiredPermissions.every(p => userPermissions.includes(p)) // AND Logic (Must have all)
            : this.requiredPermissions.some(p => userPermissions.includes(p)); // OR Logic (Must have at least one)

        // 4. Render or destroy the element
        if (hasAccess) {
            if (this.viewContainer.length === 0) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            }
        } else {
            this.viewContainer.clear();
        }
    }

    // Self-contained logic: Reads permissions directly from the JWT in localStorage
    private getUserPermissions(): string[] {
        try {
            // Safety check for Server-Side Rendering (SSR)
            if (typeof window === 'undefined' || !localStorage) return [];

            const token = localStorage.getItem('token');
            if (!token) return [];

            // Decode the JWT payload
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