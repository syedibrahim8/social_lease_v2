/**
 * Stripe test-mode helpers shared by the verify-* scripts.
 *
 * A hosted Checkout page can't be completed from a script, so funding is driven
 * with a REAL, confirmed test PaymentIntent wrapped in a session-shaped object.
 * Everything downstream of "Stripe says it's paid" — the PI lookup, the charge
 * id, refunds, the payout Transfer — then runs against real Stripe objects.
 */
import { getStripe } from '@/config/stripe';
import type { CheckoutCompletedSession } from '@/modules/payments/payment.stripe';

/** A confirmed card PaymentIntent whose funds are available immediately. */
export async function createPaidPaymentIntent(
  amount: number,
  metadata: Record<string, string>,
  transferGroup?: string
) {
  return getStripe().paymentIntents.create({
    amount,
    currency: 'usd',
    payment_method: 'pm_card_bypassPending',
    payment_method_types: ['card'],
    confirm: true,
    metadata,
    ...(transferGroup ? { transfer_group: transferGroup } : {}),
  });
}

/** The fields of a completed Checkout Session the payment service reads. */
export function paidSession(params: {
  sessionId: string;
  paymentId: string;
  contractId: string;
  paymentIntentId: string;
  amount: number;
  currency?: string;
}): CheckoutCompletedSession {
  return {
    id: params.sessionId,
    object: 'checkout.session',
    status: 'complete',
    payment_status: 'paid',
    amount_total: params.amount,
    currency: (params.currency ?? 'usd').toLowerCase(),
    payment_intent: params.paymentIntentId,
    metadata: { paymentId: params.paymentId, contractId: params.contractId },
  } as unknown as CheckoutCompletedSession;
}

/** A webhook event envelope around `object`, ready to sign. */
export function eventEnvelope(id: string, type: string, object: unknown): string {
  return JSON.stringify({
    id,
    object: 'event',
    type,
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: { object },
  });
}

export function signPayload(payload: string, secret: string): string {
  return getStripe().webhooks.generateTestHeaderString({ payload, secret });
}
