export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
