import { getStripe } from '@/config/stripe';
import { env } from '@/config/env';

/**
 * Thin adapter over the Stripe SDK. All Stripe network calls live here so the
 * service stays focused on domain orchestration and Stripe can be mocked. Return
 * types are inferred from the SDK (Stripe.Account, Stripe.Checkout.Session, …).
 */
export const stripeAdapter = {
  /** Create an Express connected account for a creator. */
  createConnectedAccount(email: string) {
    return getStripe().accounts.create({
      type: 'express',
      email,
      country: env.STRIPE_CONNECT_COUNTRY,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
    });
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

  /** Hosted Checkout session that funds the platform (escrow). */
  createCheckoutSession(params: {
    amount: number;
    currency: string;
    productName: string;
    paymentId: string;
    contractId: string;
  }) {
    return getStripe().checkout.sessions.create({
      mode: 'payment',
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
      payment_intent_data: {
        metadata: { paymentId: params.paymentId, contractId: params.contractId },
      },
      metadata: { paymentId: params.paymentId, contractId: params.contractId },
      success_url: `${env.WEB_APP_URL}/payments/success?contractId=${params.contractId}`,
      cancel_url: `${env.WEB_APP_URL}/payments/cancel?contractId=${params.contractId}`,
    });
  },

  /** Pay out the creator's share from the platform balance to their account. */
  createTransfer(params: {
    amount: number;
    currency: string;
    destination: string;
    paymentId: string;
    contractId: string;
  }) {
    return getStripe().transfers.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      destination: params.destination,
      metadata: { paymentId: params.paymentId, contractId: params.contractId },
    });
  },

  /** Refund the brand's charge (before payout). */
  createRefund(paymentIntentId: string) {
    return getStripe().refunds.create({ payment_intent: paymentIntentId });
  },

  /** Verify + parse a webhook payload using the signing secret. Throws on bad sig. */
  constructEvent(payload: Buffer, signature: string) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  },
};

export type StripeAdapter = typeof stripeAdapter;

// Stripe types, derived from the SDK (avoids referencing the Stripe namespace).
export type StripeEvent = ReturnType<typeof stripeAdapter.constructEvent>;
export type CheckoutCompletedSession = Extract<
  StripeEvent,
  { type: 'checkout.session.completed' }
>['data']['object'];
export type AccountUpdatedObject = Extract<
  StripeEvent,
  { type: 'account.updated' }
>['data']['object'];
export type PaymentIntentRef = CheckoutCompletedSession['payment_intent'];
