import { eventBus } from '@/events/event-bus';
import { notificationService } from '@/modules/notifications/notification.service';

/** Minor units → display string, e.g. (45000, 'USD') → '450.00 USD'. */
function money(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

let registered = false;

/**
 * Subscribe the notifications module to domain events. Producers (campaigns,
 * applications, payments, …) only emit — this is the single place those events
 * become user-facing notifications, so the wiring is easy to see and change.
 *
 * Idempotent: safe to call from every `createApp()` (tests build the app many
 * times) without stacking duplicate listeners.
 */
export function registerNotificationListeners(): void {
  if (registered) return;
  registered = true;

  eventBus.on('campaign.created', (p) =>
    notificationService.createForUser(p.brandId, 'CAMPAIGN_CREATED', {
      title: 'Campaign created',
      body: `Your campaign “${p.title}” has been created.`,
      data: { campaignId: p.campaignId },
      actionPath: `/campaigns/${p.campaignId}`,
    })
  );

  eventBus.on('application.received', (p) =>
    notificationService.createForUser(p.brandId, 'APPLICATION_RECEIVED', {
      title: 'New application',
      body: 'A creator applied to your campaign.',
      data: { applicationId: p.applicationId, campaignId: p.campaignId },
      actionPath: `/applications/${p.applicationId}`,
    })
  );

  eventBus.on('offer.received', (p) =>
    notificationService.createForUser(p.recipientId, 'OFFER_RECEIVED', {
      title: 'New offer',
      body: `You received an offer of ${money(p.amount, p.currency)}.`,
      data: { applicationId: p.applicationId },
      actionPath: `/applications/${p.applicationId}`,
    })
  );

  eventBus.on('offer.accepted', (p) =>
    notificationService.createForUser(p.recipientId, 'OFFER_ACCEPTED', {
      title: 'Offer accepted',
      body: `Your offer of ${money(p.amount, p.currency)} was accepted — a contract has been created.`,
      data: { applicationId: p.applicationId, campaignId: p.campaignId },
      actionPath: `/applications/${p.applicationId}`,
    })
  );

  eventBus.on('payment.received', (p) =>
    notificationService.createForUser(p.creatorId, 'PAYMENT_RECEIVED', {
      title: 'Payment secured in escrow',
      body: `${money(p.amount, p.currency)} has been funded into escrow for your contract.`,
      data: { paymentId: p.paymentId, contractId: p.contractId },
      actionPath: `/contracts/${p.contractId}`,
    })
  );

  eventBus.on('submission.approved', (p) =>
    notificationService.createForUser(p.creatorId, 'SUBMISSION_APPROVED', {
      title: 'Delivery approved',
      body: 'Your delivery was approved — your payout is being released.',
      data: { submissionId: p.submissionId, contractId: p.contractId },
      actionPath: `/contracts/${p.contractId}`,
    })
  );

  eventBus.on('verification.approved', (p) =>
    notificationService.createForUser(p.userId, 'VERIFICATION_APPROVED', {
      title: 'Verification approved',
      body: `Your ${p.verificationType} verification was approved.`,
      data: { requestId: p.requestId },
      actionPath: `/verifications/${p.requestId}`,
    })
  );
}
