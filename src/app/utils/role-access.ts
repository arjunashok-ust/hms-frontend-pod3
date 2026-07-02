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
