import { Schema, model } from 'mongoose';
import {
  MEDIA_TYPES,
  VERIFICATION_STATES,
  type ICreatorProfileDocument,
  type ICreatorProfileModel,
} from '@/modules/creators/creator.types';

// Sub-schemas use `_id: false`: these are value objects edited as a whole, so
// per-entry ids would only add churn on every update.
const socialLinksSchema = new Schema(
  {
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    twitter: { type: String, trim: true },
    facebook: { type: String, trim: true },
  },
  { _id: false }
);

const metricsSchema = new Schema(
  {
    followers: { type: Number, default: 0, min: 0 },
    engagementRate: { type: Number, default: 0, min: 0, max: 100 },
    averageReach: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const portfolioCampaignSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    brandName: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    link: { type: String, trim: true },
    completedAt: { type: Date },
  },
  { _id: false }
);

const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: MEDIA_TYPES, required: true },
    caption: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const creatorProfileSchema = new Schema<ICreatorProfileDocument, ICreatorProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one creator profile per user
      index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 1000 },
    niche: { type: String, trim: true, maxlength: 80, index: true },
    location: { type: String, trim: true, maxlength: 120, index: true },
    profileImage: { type: String, trim: true },

    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    metrics: { type: metricsSchema, default: () => ({}) },

    // Verification — system/admin controlled. Default to the lowest-trust state.
    profileOwnershipStatus: {
      type: String,
      enum: VERIFICATION_STATES,
      default: 'UNVERIFIED',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATES,
      default: 'UNVERIFIED',
      index: true,
    },

    previousCampaigns: { type: [portfolioCampaignSchema], default: [] },
    mediaGallery: { type: [mediaItemSchema], default: [] },
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
creatorProfileSchema.index({ displayName: 'text', bio: 'text' });

export const CreatorProfileModel = model<ICreatorProfileDocument, ICreatorProfileModel>(
  'CreatorProfile',
  creatorProfileSchema
);
