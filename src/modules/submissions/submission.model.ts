import { Schema, model } from 'mongoose';
import { ASSET_TYPES, PLATFORMS } from '@/modules/campaigns/campaign.types';
import {
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
    note: { type: String, trim: true, maxlength: 1000 },
    liveUrl: { type: String, trim: true, maxlength: 2048 },
    mediaUrls: { type: [String], default: [] },
    analytics: { type: analyticsSchema },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
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

// At most one PENDING submission per contract (race-safe, DB-enforced). Once a
// pending submission is reviewed (APPROVED/REVISION_REQUESTED) the slot frees up
// for the next resubmission.
submissionSchema.index(
  { contractId: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

submissionSchema.index({ brandId: 1, createdAt: -1 });
submissionSchema.index({ creatorId: 1, createdAt: -1 });

export const SubmissionModel = model<ISubmissionDocument, ISubmissionModel>(
  'Submission',
  submissionSchema
);
