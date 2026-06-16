import { randomUUID } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/httpStatus';
import { hashPassword, comparePassword } from '@/utils/password';
import { hashToken, issueToken } from '@/utils/tokens';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { UserRole } from '@/types/roles';
import { userRepository } from '@/modules/users/user.repository';
import { emailService } from '@/modules/notifications/email.service';
import { toPublicUser } from '@/modules/users/user.model';
import { AuthProvider, type IUserDocument } from '@/modules/users/user.types';
import type {
  ForgotPasswordDto,
  GoogleDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@/modules/auth/auth.validators';
import type { AuthResult } from '@/modules/auth/auth.types';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Lazily-constructed Google verifier (only when Google sign-in is configured).
let googleClient: OAuth2Client | null = null;

/**
 * Sign an access + refresh token pair for a user and persist the refresh
 * token's hash (rotating out any previous one — single active session).
 */
async function issueAuthTokens(
  user: IUserDocument
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), jti: randomUUID() });
  await userRepository.setRefreshTokenHash(user._id.toString(), hashToken(refreshToken));
  return { accessToken, refreshToken };
}

async function buildAuthResult(user: IUserDocument): Promise<AuthResult> {
  const { accessToken, refreshToken } = await issueAuthTokens(user);
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export const authService = {
  /** Register a local account, send a verification email, and log the user in. */
  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await userRepository.existsByEmail(dto.email)) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await userRepository.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      role: dto.role,
      provider: AuthProvider.LOCAL,
      isVerified: false,
    });

    await this.sendVerificationEmail(user);
    return buildAuthResult(user);
  },

  /** Verify email + password for a local account and log the user in. */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await userRepository.findByEmailWithPassword(dto.email);
    // Use one generic message for all failures to avoid leaking which part was wrong.
    if (!user || user.provider !== AuthProvider.LOCAL || !user.password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const ok = await comparePassword(dto.password, user.password);
    if (!ok) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    return buildAuthResult(user);
  },

  /** Verify a Google ID token, find-or-create the account, and log in. */
  async loginWithGoogle(dto: GoogleDto): Promise<AuthResult> {
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ApiError(HttpStatus.NOT_IMPLEMENTED, 'Google sign-in is not configured');
    }
    googleClient ??= new OAuth2Client(clientId);

    const ticket = await googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw ApiError.unauthorized('Google account could not be verified');
    }

    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      return buildAuthResult(existing);
    }

    // First-time Google user. Google emails are pre-verified. Role defaults to
    // CREATOR and can be switched during onboarding (a later slice).
    const fallbackName = payload.email.split('@')[0] ?? 'User';
    const created = await userRepository.create({
      name: payload.name ?? fallbackName,
      email: payload.email,
      ...(payload.picture ? { avatar: payload.picture } : {}),
      provider: AuthProvider.GOOGLE,
      role: UserRole.CREATOR,
      isVerified: true,
    });
    return buildAuthResult(created);
  },

  /** Validate + rotate a refresh token, returning a fresh token pair. */
  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    let userId: string;
    try {
      userId = verifyRefreshToken(rawRefreshToken).sub;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findByIdWithRefreshToken(userId);
    if (!user?.refreshToken || user.refreshToken !== hashToken(rawRefreshToken)) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    return buildAuthResult(user);
  },

  /** Revoke the stored refresh token (logout). Idempotent. */
  async logout(userId: string): Promise<void> {
    await userRepository.setRefreshTokenHash(userId, null);
  },

  /**
   * Begin password reset. Always resolves the same way whether or not the email
   * exists, so the endpoint cannot be used to enumerate accounts.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || user.provider !== AuthProvider.LOCAL) {
      return;
    }

    const token = issueToken(PASSWORD_RESET_TTL_MS);
    await userRepository.setPasswordResetToken(user._id.toString(), token.hash, token.expiresAt);

    const link = `${env.WEB_APP_URL}/reset-password?token=${token.raw}`;
    await emailService.sendPasswordReset(user.email, user.name, link);
  },

  /** Complete password reset with a valid token; invalidates existing sessions. */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await userRepository.findByValidPasswordResetToken(hashToken(dto.token));
    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(dto.password);
    await userRepository.updatePassword(user._id.toString(), passwordHash);

    // Security notification — confirm the change so unauthorised resets are noticed.
    await emailService.sendPasswordChanged(user.email, user.name);
  },

  /** Issue + email a fresh verification token. */
  async sendVerificationEmail(user: IUserDocument): Promise<void> {
    const token = issueToken(EMAIL_VERIFICATION_TTL_MS);
    await userRepository.setEmailVerificationToken(
      user._id.toString(),
      token.hash,
      token.expiresAt
    );

    const link = `${env.WEB_APP_URL}/verify-email?token=${token.raw}`;
    await emailService.sendEmailVerification(user.email, user.name, link);
  },

  /** Re-issue a verification email for a logged-in, not-yet-verified user. */
  async resendVerification(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    if (user.isVerified) {
      throw ApiError.badRequest('Email is already verified');
    }
    await this.sendVerificationEmail(user);
  },

  /** Mark an account verified given a valid verification token; send welcome. */
  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const user = await userRepository.findByValidEmailVerificationToken(hashToken(dto.token));
    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }
    await userRepository.markEmailVerified(user._id.toString());
    await emailService.sendWelcome(user.email, user.name);
  },
};

export type AuthService = typeof authService;
