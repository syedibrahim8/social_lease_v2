import type { Document, Model, Types } from 'mongoose';
import type { AssetType, Platform } from '@/modules/campaigns/campaign.types';

/**
 * Contract lifecycle. A contract is auto-generated when an application is
 * accepted (`PENDING_FUNDING`). Funding (payments) and delivery (submissions)
 * advance it further; either party may cancel before funding.
 */
export const CONTRACT_STATUSES = [
  'PENDING_FUNDING',
  'FUNDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Statuses from which a contract may still be cancelled (no money committed). */
export const CANCELLABLE_CONTRACT_STATUSES: readonly ContractStatus[] = ['PENDING_FUNDING'];

export interface IDeliverable {
  description: string;
  completed: boolean;
}

export interface ITimeline {
  durationDays: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * The formal agreement between a brand and a creator, generated from an accepted
 * application. Captures the agreed price, deliverables, timeline, and status.
 */
export interface IContract {
  applicationId: Types.ObjectId;
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  assetType: AssetType;
  platform: Platform;
  agreedPrice: number; // minor units (e.g. cents)
  currency: string;
  deliverables: IDeliverable[];
  timeline: ITimeline;
  status: ContractStatus;
}

export interface IContractDocument extends IContract, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IContractModel = Model<IContractDocument>;
