import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { acquireLock } from '@/config/lock';
import { isStripeConfigured } from '@/config/stripe';
import { paymentService } from '@/modules/payments/payment.service';

let timer: NodeJS.Timeout | null = null;
let running = false;

/**
 * One reconciler sweep. `running` stops overlapping sweeps in this process; the
 * lock stops them across instances when Redis is configured. Neither is needed
 * for correctness — every repair is idempotent — they only avoid wasted calls.
 */
export async function runPaymentReconcile(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const locked = await acquireLock('payment-reconcile', env.PAYMENT_RECONCILE_INTERVAL_MS);
    if (!locked) return;
    const result = await paymentService.reconcile();
    if (result.funded || result.released || result.refunded) {
      logger.info('Payment reconcile repaired payments', result);
    }
  } catch (error) {
    logger.error('Payment reconcile failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    running = false;
  }
}

/** Start the periodic sweep (no-op without Stripe or with the interval at 0). */
export function startPaymentReconcileJob(): void {
  if (timer || !isStripeConfigured() || env.PAYMENT_RECONCILE_INTERVAL_MS === 0) return;
  timer = setInterval(() => void runPaymentReconcile(), env.PAYMENT_RECONCILE_INTERVAL_MS);
  timer.unref();
  logger.info('Payment reconciler started', { intervalMs: env.PAYMENT_RECONCILE_INTERVAL_MS });
}

export function stopPaymentReconcileJob(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
