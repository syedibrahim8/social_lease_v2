import { Schema, model } from 'mongoose';
import {
  ASSET_TYPES,
  CAMPAIGN_STATUSES,
  PLATFORMS,
  type ICampaignDocument,
  type ICampaignModel,
} from '@/modules/campaigns/campaign.types';

const campaignSchema = new Schema<ICampaignDocument, ICampaignModel>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    assetType: { type: String, enum: ASSET_TYPES, required: true, index: true },
    platform: { type: String, enum: PLATFORMS, required: true, index: true },
    duration: { type: Number, required: true, min: 1 },
    budgetMin: { type: Number, required: true, min: 0 },
    budgetMax: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    requirements: { type: [String], default: [] },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: 'DRAFT',
      required: true,
      index: true,
    },
    publishedAt: { type: Date },
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

// Full-text search over the human-readable fields (used by the browse endpoint).
campaignSchema.index({ title: 'text', description: 'text' });
// Common browse path: published campaigns, newest first.
campaignSchema.index({ status: 1, createdAt: -1 });

export const CampaignModel = model<ICampaignDocument, ICampaignModel>('Campaign', campaignSchema);
