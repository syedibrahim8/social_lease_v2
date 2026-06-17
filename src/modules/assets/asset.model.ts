import { Schema, model } from 'mongoose';
import { PLATFORMS } from '@/modules/campaigns/campaign.types';
import { VERIFICATION_STATES } from '@/types/verification';
import {
  ASSET_CATEGORIES,
  AVAILABILITY_STATUSES,
  MARKETPLACE_ASSET_TYPES,
  type IAssetDocument,
  type IAssetModel,
} from '@/modules/assets/asset.types';

const ageRangeSchema = new Schema(
  {
    range: { type: String, required: true, trim: true, maxlength: 20 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const countryShareSchema = new Schema(
  {
    country: { type: String, required: true, trim: true, maxlength: 60 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const genderSplitSchema = new Schema(
  {
    male: { type: Number, min: 0, max: 100 },
    female: { type: Number, min: 0, max: 100 },
    other: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const audienceDemographicsSchema = new Schema(
  {
    ageRanges: { type: [ageRangeSchema], default: undefined },
    genderSplit: { type: genderSplitSchema },
    topCountries: { type: [countryShareSchema], default: undefined },
    topCities: { type: [String], default: undefined },
  },
  { _id: false }
);

// Calendar block keeps its `_id` so it can be removed by id.
const availabilityBlockSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 280 },
});

const availabilitySchema = new Schema(
  {
    status: { type: String, enum: AVAILABILITY_STATUSES, default: 'AVAILABLE', required: true },
    leadTimeDays: { type: Number, min: 0 },
    blocks: { type: [availabilityBlockSchema], default: [] },
  },
  { _id: false }
);

const assetSchema = new Schema<IAssetDocument, IAssetModel>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assetType: { type: String, enum: MARKETPLACE_ASSET_TYPES, required: true, index: true },
    platform: { type: String, enum: PLATFORMS, required: true, index: true },
    category: { type: String, enum: ASSET_CATEGORIES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    estimatedReach: { type: Number, default: 0, min: 0 },
    averageViews: { type: Number, default: 0, min: 0 },
    audienceDemographics: { type: audienceDemographicsSchema },
    availability: { type: availabilitySchema, default: () => ({}) },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATES,
      default: 'UNVERIFIED',
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

// Full-text search over the listing copy.
assetSchema.index({ title: 'text', description: 'text' });
// A creator's own assets, newest first.
assetSchema.index({ creatorId: 1, createdAt: -1 });

export const AssetModel = model<IAssetDocument, IAssetModel>('Asset', assetSchema);
