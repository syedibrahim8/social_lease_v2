import type { PaginationMeta } from '@/utils/ApiResponse';

/**
 * Pagination helpers shared by every list endpoint.
 *
 * `resolvePagination` turns optional, untrusted `page`/`limit` query values into
 * safe, clamped numbers plus the `skip` to feed Mongo. `buildPaginationMeta`
 * produces the `meta` block returned alongside the data so clients can render
 * pagers without extra round-trips.
 */

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export function resolvePagination(page = 1, limit = 20, maxLimit = 100): PageParams {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), maxLimit);
  const safePage = Math.max(Math.trunc(page), 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && page <= totalPages,
  };
}
