import { UserModel } from '@/modules/users/user.model';
import type { IUser, IUserDocument } from '@/modules/users/user.types';

/**
 * UserRepository — the ONLY place in the codebase that talks to the User
 * Mongoose model. Services depend on this interface, never on Mongoose directly,
 * which keeps business logic persistence-agnostic and easy to mock in tests.
 *
 * Methods that need `select:false` fields (password, refreshToken, reset/verify
 * hashes) request them explicitly via `.select('+field')`.
 */
export const userRepository = {
  create(data: Partial<IUser>): Promise<IUserDocument> {
    return UserModel.create(data);
  },

  findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).exec();
  },

  findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  },

  /** Includes the password hash — for login verification only. */
  findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  },

  /** Includes the stored refresh-token hash — for refresh/rotation only. */
  findByIdWithRefreshToken(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).select('+refreshToken').exec();
  },

  existsByEmail(email: string): Promise<boolean> {
    return UserModel.exists({ email: email.toLowerCase() })
      .exec()
      .then((doc) => doc !== null);
  },

  setRefreshTokenHash(id: string, hash: string | null): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { refreshToken: hash }, { new: true }).exec();
  },

  updatePassword(id: string, passwordHash: string): Promise<IUserDocument | null> {
    // Changing the password invalidates any existing session.
    return UserModel.findByIdAndUpdate(
      id,
      {
        password: passwordHash,
        refreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      { new: true }
    ).exec();
  },

  setPasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    }).exec();
  },

  /** Find a user by a non-expired password-reset token hash. */
  findByValidPasswordResetToken(tokenHash: string): Promise<IUserDocument | null> {
    return UserModel.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();
  },

  setEmailVerificationToken(
    id: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, {
      emailVerificationToken: tokenHash,
      emailVerificationExpires: expiresAt,
    }).exec();
  },

  findByValidEmailVerificationToken(tokenHash: string): Promise<IUserDocument | null> {
    return UserModel.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();
  },

  markEmailVerified(id: string): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      { new: true }
    ).exec();
  },
};

export type UserRepository = typeof userRepository;
