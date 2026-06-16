import { z } from 'zod';
import { SELF_ASSIGNABLE_ROLES } from '@/types/roles';

/**
 * Zod schemas for the auth endpoints. Each is consumed by the `validate`
 * middleware; the inferred types below are the DTOs the service layer receives.
 */

const email = z.string().trim().toLowerCase().email('A valid email is required');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email,
  password,
  // Only CREATOR or BRAND may be self-assigned at registration.
  role: z.enum(SELF_ASSIGNABLE_ROLES),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type GoogleDto = z.infer<typeof googleSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
