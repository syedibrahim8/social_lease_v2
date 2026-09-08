import { z } from "zod";

/**
 * Mirrors `src/modules/auth/auth.validators.ts` exactly.
 *
 * Exactly, on purpose: a client rule STRICTER than the server rejects input the
 * backend would have accepted, and a LOOSER one spends a round trip to be told
 * something we already knew. Both are worse than agreeing. If the backend rules
 * change, change these in the same commit.
 */

const email = z.string().trim().toLowerCase().email("A valid email is required");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email,
  password,
  // ADMIN is never self-assignable; the backend rejects it outright.
  role: z.enum(["CREATOR", "BRAND"]),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
