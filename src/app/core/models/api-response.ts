export type IsoDateString = string;
export type DecimalString = string;

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: PaginationMeta;
  message: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginationQuery {
  page?: number;
  per_page?: number;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ValidationErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface UnauthenticatedErrorResponse {
  message: 'Unauthenticated.' | 'Invalid credentials';
}

export interface ForbiddenErrorResponse {
  message: 'Forbidden.';
}

export interface NotFoundErrorResponse {
  message: 'User not found' | 'Product not found';
}

export interface ConflictErrorResponse {
  message: string;
}

export type ApiErrorResponse =
  | ValidationErrorResponse
  | UnauthenticatedErrorResponse
  | ForbiddenErrorResponse
  | NotFoundErrorResponse
  | ConflictErrorResponse;

export type BooleanQueryValue = boolean | 'true' | 'false';

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
