import type { Document, Model, Types } from 'mongoose';
import type { UserRole } from '@/types/roles';

/** How a user authenticates. */
export const AuthProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

/**
 * The User domain entity as stored in MongoDB.
 *
 * Sensitive fields (`password`, `refreshToken`, and the reset/verify token
 * hashes) are `select: false` in the schema, so they are never returned unless a
 * query explicitly asks for them. The `toJSON` transform additionally strips
 * them and exposes `id` instead of `_id`.
 */
export interface IUser {
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  role: UserRole;
  isVerified: boolean;

  /** bcrypt hash. Absent for OAuth-only accounts. select:false. */
  password?: string;
  /** SHA-256 hash of the current refresh token (single active session). select:false. */
  refreshToken?: string | null;

  /** SHA-256 hash of the active password-reset token. select:false. */
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;

  /** SHA-256 hash of the active email-verification token. select:false. */
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

/** Hydrated Mongoose document. */
export interface IUserDocument extends IUser, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserModel = Model<IUserDocument>;

/** The safe, public-facing shape returned to clients (no secrets). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: AuthProvider;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
