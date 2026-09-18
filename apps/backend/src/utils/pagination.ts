// apps/backend/src/utils/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '25'), 10) || 25));
  const offset = (page - 1) * limit;
  const sort = typeof query.sort === 'string' ? query.sort : 'created_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const search = typeof query.search === 'string' ? query.search.trim() : undefined;

  return { page, limit, offset, sort, order, search };
}
