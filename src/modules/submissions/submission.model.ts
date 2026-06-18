import { Schema, model } from 'mongoose';
import { ASSET_TYPES, PLATFORMS } from '@/modules/campaigns/campaign.types';
import {
  DELIVERY_FILE_TYPES,
  SUBMISSION_STATUSES,
  type ISubmissionDocument,
  type ISubmissionModel,
} from '@/modules/submissions/submission.types';

const analyticsSchema = new Schema(
  {
    impressions: { type: Number, min: 0 },
    reach: { type: Number, min: 0 },
    likes: { type: Number, min: 0 },
    comments: { type: Number, min: 0 },
    shares: { type: Number, min: 0 },
    saves: { type: Number, min: 0 },
  },
  { _id: false }
);

const deliveryFileSchema = new Schema(
  {
    type: { type: String, enum: DELIVERY_FILE_TYPES, required: true },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    caption: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const deliveryLinkSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    label: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const submissionSchema = new Schema<ISubmissionDocument, ISubmissionModel>(
  {
    // `contractId` is indexed via the partial-unique index below; `brandId` /
    // `creatorId` via the compound `…_createdAt` indexes below.
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assetType: { type: String, enum: ASSET_TYPES, required: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    revision: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: 'DRAFT',
      required: true,
      index: true,
    },
    files: { type: [deliveryFileSchema], default: [] },
    links: { type: [deliveryLinkSchema], default: [] },
    note: { type: String, trim: true, maxlength: 1000 },
    analytics: { type: analyticsSchema },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
    submittedAt: { type: Date },
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

// At most one SUBMITTED (under-review) delivery per contract — race-safe and
// DB-enforced, so the approve→payout path can never fire twice. A single active
// (DRAFT/SUBMITTED/REVISION_REQUESTED) delivery per contract is enforced in the
// service.
submissionSchema.index(
  { contractId: 1 },
  { unique: true, partialFilterExpression: { status: 'SUBMITTED' } }
);

submissionSchema.index({ brandId: 1, createdAt: -1 });
submissionSchema.index({ creatorId: 1, createdAt: -1 });

export const SubmissionModel = model<ISubmissionDocument, ISubmissionModel>(
  'Submission',
  submissionSchema
);
