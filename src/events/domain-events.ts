/**
 * Domain events — the contract between producers (feature modules) and consumers
 * (the notifications module, future analytics/jobs). Producers emit; they do NOT
 * know who listens. This keeps modules decoupled: e.g. the applications module
 * never imports the notifications module — it just emits `application.received`.
 *
 * Each key is an event name; its value is the typed payload. The payload always
 * carries enough context (recipient id + ids/amounts) for a listener to act
 * without calling back into the producing module.
 */
export interface DomainEventPayloads {
  'campaign.created': { campaignId: string; brandId: string; title: string };
  'application.received': {
    applicationId: string;
    campaignId: string;
    brandId: string;
    creatorId: string;
  };
  'offer.received': {
    applicationId: string;
    recipientId: string;
    senderId: string;
    amount: number;
    currency: string;
  };
  'offer.accepted': {
    applicationId: string;
    campaignId: string;
    recipientId: string;
    amount: number;
    currency: string;
  };
  'payment.received': {
    paymentId: string;
    contractId: string;
    creatorId: string;
    amount: number;
    currency: string;
  };
  'submission.approved': { submissionId: string; contractId: string; creatorId: string };
  'verification.approved': { requestId: string; userId: string; verificationType: string };
}

export type DomainEventName = keyof DomainEventPayloads;
