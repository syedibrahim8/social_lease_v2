import { Schema, model } from 'mongoose';
import { ALL_ROLES, UserRole } from '@/types/roles';
import {
  AuthProvider,
  type IUserDocument,
  type IUserModel,
  type PublicUser,
} from '@/modules/users/user.types';

/**
 * User schema.
 *
 * Security-sensitive fields use `select: false` so they are excluded from query
 * results by default; callers must opt in (e.g. `.select('+password')`) when
 * they genuinely need them. The `toJSON` transform is the second line of
 * defence — it strips those fields and renames `_id` → `id`.
 */
const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name must be at most 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: { type: String, trim: true },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
      required: true,
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: UserRole.CREATOR,
      required: true,
      index: true,
    },
    isVerified: { type: Boolean, default: false },

    password: {
      type: String,
      // Required only for local accounts; OAuth accounts have no password.
      required: [
        function (this: IUserDocument): boolean {
          return this.provider === AuthProvider.LOCAL;
        },
        'Password is required',
      ],
      select: false,
    },
    refreshToken: { type: String, default: null, select: false },

    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },

    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      },
    },
  }
);

/** Map a (possibly secret-bearing) document to the safe public shape. */
export function toPublicUser(doc: IUserDocument): PublicUser {
  const base: PublicUser = {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    provider: doc.provider,
    role: doc.role,
    isVerified: doc.isVerified,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return doc.avatar ? { ...base, avatar: doc.avatar } : base;
}

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);
