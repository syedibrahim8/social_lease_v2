import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '@/modules/auth/auth.controller';
import { authenticate } from '@/middleware/authenticate.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/modules/auth/auth.validators';

/**
 * Auth routes, mounted at `${API_PREFIX}/auth`.
 *
 * Credential endpoints get a tighter, dedicated rate limit on top of the global
 * one, since they are the prime targets for brute-force and abuse. Keyed by IP +
 * email so one attacker can't lock out every account from a single address.
 */
const router = Router();

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.', errors: [] },
});

router.post(
  '/register',
  credentialsLimiter,
  validate({ body: registerSchema }),
  authController.register
);
router.post('/login', credentialsLimiter, validate({ body: loginSchema }), authController.login);
router.post('/google', validate({ body: googleSchema }), authController.google);

router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/resend-verification', authenticate, authController.resendVerification);

router.post(
  '/forgot-password',
  credentialsLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  credentialsLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);
router.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);

export { router as authRouter };
