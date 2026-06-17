import { z } from 'zod';
import { PAYMENT_STATUSES } from '@/modules/payments/payment.types';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const contractIdParamsSchema = z.object({ contractId: objectId });
export const paymentIdParamsSchema = z.object({ id: objectId });

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type ContractIdParams = z.infer<typeof contractIdParamsSchema>;
export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
