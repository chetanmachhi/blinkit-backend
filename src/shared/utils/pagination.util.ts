export interface PaginationInput {
  page?: string | number;
  limit?: string | number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export const parsePagination = (
  query: PaginationInput = {}
): ParsedPagination => {
  let page =
    typeof query.page === "number"
      ? query.page
      : parseInt(query.page || "1", 10);
  let limit =
    typeof query.limit === "number"
      ? query.limit
      : parseInt(query.limit || "20", 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 1;
  if (limit > 50) limit = 50;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationResponse = (
  total: number,
  page: number,
  limit: number
): PaginationResponse => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
  };
};
