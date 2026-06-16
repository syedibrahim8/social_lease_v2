/**
 * Verification states shared across profile types (creators, brands, …).
 *
 * These are always system/admin controlled — never settable by the resource
 * owner through create/update. Defined once here so every module agrees on the
 * same set of states.
 */
export const VERIFICATION_STATES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];
