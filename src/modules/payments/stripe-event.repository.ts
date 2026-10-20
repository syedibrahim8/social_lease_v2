import type { ClientSession } from 'mongoose';
import { StripeEventModel } from '@/modules/payments/stripe-event.model';

export const stripeEventRepository = {
  async isProcessed(eventId: string): Promise<boolean> {
    return (await StripeEventModel.exists({ eventId }).exec()) !== null;
  },

  /**
   * Mark an event applied. Inside a transaction a duplicate key aborts the whole
   * transaction, so a concurrently re-delivered event can't double-apply.
   */
  async record(eventId: string, type: string, session?: ClientSession): Promise<void> {
    await new StripeEventModel({ eventId, type }).save({ session: session ?? null });
  },
};
