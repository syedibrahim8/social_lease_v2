import Stripe from 'stripe';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/httpStatus';

/**
 * Stripe client — lazily constructed so the app boots without payment keys
 * (payment endpoints then respond 501). The SDK pins its own API version.
 *
 * The rich Stripe event/resource types are derived from SDK return types in
 * `payment.stripe.ts` rather than referenced via the namespace, which keeps this
 * version-proof across Stripe SDK type-layout changes.
 */
export type StripeClient = InstanceType<typeof Stripe>;

let client: StripeClient | null = null;

export function getStripe(): StripeClient {
  if (!env.STRIPE_SECRET_KEY) {
    throw new ApiError(HttpStatus.NOT_IMPLEMENTED, 'Payments are not configured');
  }
  client ??= new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}
