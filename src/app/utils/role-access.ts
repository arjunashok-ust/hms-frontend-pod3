/**
 * @file role-access.ts
 * @description
 * This file provides utility functions for normalizing and checking user roles.
 *
 * @overview
 * This module exports helper functions to standardize role strings (`normalizeRole`) and to check if a user's role is included in a list of allowed roles (`hasRoleAccess`). These are simple, pure functions used for access control logic within components.
 *
 * Connections:
 *   (Components) -> ROLE-ACCESS.TS
 */
export function normalizeRole(role: string | null | undefined): string | null {
    const trimmedRole = role?.toString().trim();
    return trimmedRole ? trimmedRole.toUpperCase() : null;
}

export function hasRoleAccess(
    rolesAllowed: string[] | undefined,
    userRole: string | null | undefined,
): boolean {
    const normalizedUserRole = normalizeRole(userRole);
    if (!normalizedUserRole) {
        return false;
    }

    return (rolesAllowed || []).some((role) => normalizeRole(role) === normalizedUserRole);
}
