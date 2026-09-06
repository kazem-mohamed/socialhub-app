/**
 * The API returns loosely-shaped envelopes: some routes nest payloads under
 * `data`, some return them at the top level. Rather than let every component
 * guess (as they used to), responses are typed as `unknown` and narrowed once,
 * inside each feature's normalizer.
 */
export type UnknownRecord = Record<string, unknown>;

/** Pagination metadata, under any of the names the API has used for it. */
export interface PaginationInfo {
  page: number;
  totalPages: number | null;
  totalCount: number | null;
}

/** One page of a paginated list. */
export interface Page<T> extends PaginationInfo {
  items: T[];
}
