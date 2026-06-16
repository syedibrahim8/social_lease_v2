import { Schema, model } from 'mongoose';
import {
  COMPANY_SIZES,
  VERIFICATION_STATES,
  type IBrandProfileDocument,
  type IBrandProfileModel,
} from '@/modules/brands/brand.types';

const brandProfileSchema = new Schema<IBrandProfileDocument, IBrandProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one brand/company profile per user
      index: true,
    },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    logo: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, maxlength: 80, index: true },
    companySize: { type: String, enum: COMPANY_SIZES, index: true },
    description: { type: String, trim: true, maxlength: 2000 },

    // Verification — system/admin controlled. Default to the lowest-trust state.
    verifiedStatus: {
      type: String,
      enum: VERIFICATION_STATES,
      default: 'UNVERIFIED',
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

// Full-text search over the human-readable fields (used by the browse endpoint).
brandProfileSchema.index({ companyName: 'text', description: 'text' });

export const BrandProfileModel = model<IBrandProfileDocument, IBrandProfileModel>(
  'BrandProfile',
  brandProfileSchema
);
