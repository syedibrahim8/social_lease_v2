import { Schema, model, type Document, type Model, type Types } from 'mongoose';

/**
 * Stripe webhook events that have been applied. The unique `eventId` is written
 * inside the same transaction as the event's effects, so an event Stripe
 * delivers twice (it does) is applied exactly once.
 */
export interface IStripeEvent {
  eventId: string;
  type: string;
  processedAt: Date;
}

export interface IStripeEventDocument extends IStripeEvent, Document<Types.ObjectId> {
  _id: Types.ObjectId;
}
export type IStripeEventModel = Model<IStripeEventDocument>;

const stripeEventSchema = new Schema<IStripeEventDocument, IStripeEventModel>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, required: true, default: () => new Date() },
});

export const StripeEventModel = model<IStripeEventDocument, IStripeEventModel>(
  'StripeEvent',
  stripeEventSchema
);
