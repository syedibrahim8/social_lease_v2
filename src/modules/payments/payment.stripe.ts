import { getStripe } from '@/config/stripe';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

/** Checkout sessions stay payable this long. Stripe's minimum is 30 minutes. */
const CHECKOUT_TTL_SECONDS = 31 * 60;

/**
 * Thin adapter over the Stripe SDK. All Stripe network calls live here so the
 * service stays focused on domain orchestration and Stripe can be mocked. Return
 * types are inferred from the SDK (Stripe.Account, Stripe.Checkout.Session, …).
 *
 * Every call that CREATES something carries an idempotency key. A retried
 * request with the same key returns the original object instead of creating a
 * second one — that is what makes a retried payout or refund unable to pay twice.
 */
export const stripeAdapter = {
  /** Create an Express connected account for a creator, bound to their user id. */
  createConnectedAccount(email: string, userId: string) {
    return getStripe().accounts.create(
      {
        type: 'express',
        email,
        country: env.STRIPE_CONNECT_COUNTRY,
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        metadata: { userId },
      },
      { idempotencyKey: `connect-account-${userId}` }
    );
  },

  /** Backfill the owner binding on an account created before it was recorded. */
  bindAccountToUser(accountId: string, userId: string) {
    return getStripe().accounts.update(accountId, { metadata: { userId } });
  },

  /** Onboarding link the creator opens to finish KYC. */
  createAccountLink(accountId: string) {
    return getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${env.WEB_APP_URL}/payments/onboard/refresh`,
      return_url: `${env.WEB_APP_URL}/payments/onboard/return`,
      type: 'account_onboarding',
    });
  },

  retrieveAccount(accountId: string) {
    return getStripe().accounts.retrieve(accountId);
  },

  /** The Stripe Customer a brand's checkouts are bound to. */
  createCustomer(params: { email: string; name?: string; userId: string }) {
    return getStripe().customers.create(
      {
        email: params.email,
        ...(params.name ? { name: params.name } : {}),
        metadata: { userId: params.userId },
      },
      { idempotencyKey: `customer-${params.userId}` }
    );
  },

  /** Hosted Checkout session that funds the platform (escrow). */
  createCheckoutSession(params: {
    amount: number;
    currency: string;
    productName: string;
    paymentId: string;
    contractId: string;
    brandId: string;
    creatorId: string;
    customerId: string;
    transferGroup: string;
    attempt: number;
  }) {
    const metadata = {
      paymentId: params.paymentId,
      contractId: params.contractId,
      brandId: params.brandId,
      creatorId: params.creatorId,
    };
    return getStripe().checkout.sessions.create(
      {
        mode: 'payment',
        customer: params.customerId,
        client_reference_id: params.contractId,
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: { name: params.productName },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ],
        // Funds settle to the platform; the creator is paid later via Transfer.
        payment_intent_data: { metadata, transfer_group: params.transferGroup },
        metadata,
        success_url: `${env.WEB_APP_URL}/payments/success?contractId=${params.contractId}`,
        cancel_url: `${env.WEB_APP_URL}/payments/cancel?contractId=${params.contractId}`,
      },
      { idempotencyKey: `checkout-${params.paymentId}-${params.attempt}` }
    );
  },

  retrieveCheckoutSession(sessionId: string) {
    return getStripe().checkout.sessions.retrieve(sessionId);
  },

  /** Close an open session so it can no longer be paid. */
  expireCheckoutSession(sessionId: string) {
    return getStripe().checkout.sessions.expire(sessionId);
  },

  retrievePaymentIntent(paymentIntentId: string) {
    return getStripe().paymentIntents.retrieve(paymentIntentId);
  },

  /**
   * Pay out the creator's share from the platform balance to their account.
   * `sourceTransaction` ties the Transfer to the funding charge, so it can only
   * spend money that charge brought in.
   */
  createTransfer(params: {
    amount: number;
    currency: string;
    destination: string;
    paymentId: string;
    contractId: string;
    transferGroup?: string;
    sourceTransaction?: string;
    attempt: number;
  }) {
    return getStripe().transfers.create(
      {
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        destination: params.destination,
        ...(params.transferGroup ? { transfer_group: params.transferGroup } : {}),
        ...(params.sourceTransaction ? { source_transaction: params.sourceTransaction } : {}),
        metadata: { paymentId: params.paymentId, contractId: params.contractId },
      },
      { idempotencyKey: `release-${params.paymentId}-${params.attempt}` }
    );
  },

  /**
   * The payout already sent for a payment, if any. Idempotency keys only last
   * 24 hours, so a retry later than that checks Stripe itself before sending.
   */
  async findTransferForPayment(transferGroup: string, paymentId: string) {
    const page = await getStripe().transfers.list({ transfer_group: transferGroup, limit: 20 });
    return page.data.find((t) => t.metadata?.paymentId === paymentId) ?? null;
  },

  /** A refund already issued (or in flight) against a payment intent, if any. */
  async findRefundForPaymentIntent(paymentIntentId: string) {
    const page = await getStripe().refunds.list({ payment_intent: paymentIntentId, limit: 20 });
    return page.data.find((r) => r.status === 'succeeded' || r.status === 'pending') ?? null;
  },

  /** Refund a charge in full. `key` scopes the idempotency (one refund per key). */
  createRefund(paymentIntentId: string, key: string, metadata: Record<string, string> = {}) {
    return getStripe().refunds.create(
      { payment_intent: paymentIntentId, metadata },
      { idempotencyKey: key }
    );
  },

  /** Verify + parse a webhook payload using the signing secret. Throws on bad sig. */
  constructEvent(payload: Buffer, signature: string) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  },
};

/**
 * Whether a failed Stripe call definitely did NOT happen.
 *
 * A request Stripe rejected (bad request, card declined, permissions,
 * idempotency mismatch) changed nothing, so the claim can be rolled back and
 * retried later under a new attempt. A network error or a 5xx is ambiguous: the
 * Transfer may have been created, so the claim stays put and the reconciler
 * retries with the SAME idempotency key, which returns the original result.
 */
export function isDefinitiveStripeFailure(error: unknown): boolean {
  if (error instanceof ApiError) return true; // e.g. Stripe not configured
  const type = (error as { type?: unknown } | null)?.type;
  return (
    type === 'StripeInvalidRequestError' ||
    type === 'StripeCardError' ||
    type === 'StripePermissionError' ||
    type === 'StripeAuthenticationError' ||
    type === 'StripeIdempotencyError'
  );
}

export function stripeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}

export type StripeAdapter = typeof stripeAdapter;

// Stripe types, derived from the SDK (avoids referencing the Stripe namespace).
export type StripeEvent = ReturnType<typeof stripeAdapter.constructEvent>;
type EventObject<T extends StripeEvent['type']> = Extract<
  StripeEvent,
  { type: T }
>['data']['object'];
export type CheckoutCompletedSession = EventObject<'checkout.session.completed'>;
export type AccountUpdatedObject = EventObject<'account.updated'>;
export type ChargeObject = EventObject<'charge.refunded'>;
export type DisputeObject = EventObject<'charge.dispute.created'>;
export type PaymentIntentRef = CheckoutCompletedSession['payment_intent'];
