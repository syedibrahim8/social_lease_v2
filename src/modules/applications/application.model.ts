import { Schema, model } from 'mongoose';
import { ASSET_TYPES } from '@/modules/campaigns/campaign.types';
import {
  APPLICATION_STATUSES,
  OFFER_STATUSES,
  type IApplicationDocument,
  type IApplicationModel,
} from '@/modules/applications/application.types';

const offerSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    message: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: OFFER_STATUSES, default: 'PENDING', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new Schema<IApplicationDocument, IApplicationModel>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assetType: { type: String, enum: ASSET_TYPES, required: true, index: true },
    proposal: { type: String, required: true, trim: true, maxlength: 2000 },
    proposedPrice: { type: Number, required: true, min: 0 },
    estimatedReach: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    agreedPrice: { type: Number, min: 0 },
    offers: { type: [offerSchema], default: [] },
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

// One application per creator per campaign.
applicationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });

// THE LOCK: at most one ACCEPTED application per (creator, assetType). The
// partial filter means non-accepted applications are unconstrained, so a creator
// may apply to many campaigns for the same asset — but can be *selected* for only
// one at a time. Enforced atomically by the DB (race-safe).
applicationSchema.index(
  { creatorId: 1, assetType: 1 },
  { unique: true, partialFilterExpression: { status: 'ACCEPTED' } }
);

// List query paths.
applicationSchema.index({ creatorId: 1, status: 1 });
applicationSchema.index({ brandId: 1, status: 1 });

export const ApplicationModel = model<IApplicationDocument, IApplicationModel>(
  'Application',
  applicationSchema
);
