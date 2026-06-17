import type { Document, Model, Types } from 'mongoose';
import type { AssetType } from '@/modules/campaigns/campaign.types';

/** Overall lifecycle of an application. */
export const APPLICATION_STATUSES = [
  'PENDING', // submitted, awaiting the brand's first response
  'NEGOTIATING', // at least one counter-offer has been exchanged
  'ACCEPTED', // agreement reached — the creator's asset is now locked
  'REJECTED', // declined by a party (or auto-rejected by the lock)
  'WITHDRAWN', // pulled by the creator
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Application states in which negotiation actions are still possible. */
export const ACTIVE_APPLICATION_STATUSES: readonly ApplicationStatus[] = ['PENDING', 'NEGOTIATING'];

/** Status of a single offer within the negotiation thread. */
export const OFFER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** One message in the back-and-forth negotiation thread. */
export interface IOffer {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  amount: number; // minor units (e.g. cents)
  message?: string;
  status: OfferStatus;
  createdAt: Date;
}

/**
 * A creator's application to a campaign, including the embedded negotiation
 * thread. `assetType` is denormalized from the campaign so the per-asset lock
 * (one ACCEPTED application per creator+assetType) can be enforced with a single
 * partial-unique index, without joining to campaigns.
 */
export interface IApplication {
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId; // campaign owner (denormalized)
  creatorId: Types.ObjectId;
  assetType: AssetType; // denormalized from the campaign
  proposal: string;
  proposedPrice: number; // minor units
  estimatedReach: number;
  currency: string;
  status: ApplicationStatus;
  agreedPrice?: number;
  offers: IOffer[];
}

export interface IApplicationDocument extends IApplication, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IApplicationModel = Model<IApplicationDocument>;
