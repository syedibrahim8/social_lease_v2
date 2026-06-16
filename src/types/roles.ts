/**
 * Application roles. Defined once here (a foundational shared type) so the User
 * model, JWT payloads, and the `authorize` RBAC middleware all agree on the same
 * source of truth.
 */
export const UserRole = {
  CREATOR: 'CREATOR',
  BRAND: 'BRAND',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES = Object.values(UserRole);

/**
 * Roles a user may self-assign during public registration. ADMIN is intentionally
 * excluded — it can only be granted by another admin / seeding, never claimed.
 */
export const SELF_ASSIGNABLE_ROLES = [UserRole.CREATOR, UserRole.BRAND] as const;
