import { Schema, model } from 'mongoose';
import { ASSET_TYPES, PLATFORMS } from '@/modules/campaigns/campaign.types';
import {
  CONTRACT_STATUSES,
  type IContractDocument,
  type IContractModel,
} from '@/modules/contracts/contract.types';

const deliverableSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 500 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const timelineSchema = new Schema(
  {
    durationDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false }
);

const contractSchema = new Schema<IContractDocument, IContractModel>(
  {
    // One contract per accepted application.
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
      index: true,
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assetType: { type: String, enum: ASSET_TYPES, required: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    agreedPrice: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    deliverables: { type: [deliverableSchema], default: [] },
    timeline: { type: timelineSchema, required: true },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: 'PENDING_FUNDING',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export const ContractModel = model<IContractDocument, IContractModel>('Contract', contractSchema);
