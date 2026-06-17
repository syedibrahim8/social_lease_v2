import type { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { stripeAdapter, type StripeEvent } from '@/modules/payments/payment.stripe';
import { paymentService } from '@/modules/payments/payment.service';

/**
 * Stripe webhook endpoint.
 *
 * Mounted with `express.raw` (NOT the JSON parser) so the exact bytes Stripe
 * signed are available for signature verification. An invalid/missing signature
 * is rejected with 400 before any processing. Handlers are idempotent, so Stripe
 * retries (on a 5xx) are safe.
 */
export function stripeWebhookHandler(req: Request, res: Response): void {
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: StripeEvent;
  try {
    // With express.raw, req.body is the raw Buffer.
    event = stripeAdapter.constructEvent(req.body as Buffer, signature);
  } catch (error) {
    logger.warn('Stripe webhook signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(400).send('Invalid signature');
    return;
  }

  // Acknowledge fast; process, and surface a 5xx if processing fails so Stripe
  // retries. (All handlers are idempotent.)
  paymentService
    .processWebhookEvent(event)
    .then(() => res.status(200).json({ received: true }))
    .catch((error: unknown) => {
      logger.error('Stripe webhook processing failed', {
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ received: false });
    });
}
