import { z } from 'zod';
import { CONTRACT_STATUSES } from '@/modules/contracts/contract.types';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listContractsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  campaignId: objectId.optional(),
});

export const contractIdParamsSchema = z.object({ id: objectId });

export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;
export type ContractIdParams = z.infer<typeof contractIdParamsSchema>;
