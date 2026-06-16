import type { PublicUser } from '@/modules/users/user.types';

/**
 * Result of any successful authentication. The controller returns `user` +
 * `accessToken` in the JSON body and sets `refreshToken` as an httpOnly cookie —
 * the raw refresh token never appears in a response body.
 */
export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
