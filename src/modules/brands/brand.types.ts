import type { Document, Model, Types } from 'mongoose';

export { VERIFICATION_STATES } from '@/types/verification';
export type { VerificationState } from '@/types/verification';
import type { VerificationState } from '@/types/verification';

/** Company-size buckets used for filtering and display. */
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

/** The BrandProfile domain entity as stored in MongoDB. */
export interface IBrandProfile {
  userId: Types.ObjectId;
  companyName: string;
  logo?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  description?: string;
  /** System/admin controlled — never set by the brand. */
  verifiedStatus: VerificationState;
}

export interface IBrandProfileDocument extends IBrandProfile, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IBrandProfileModel = Model<IBrandProfileDocument>;
