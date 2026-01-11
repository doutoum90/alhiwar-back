export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}