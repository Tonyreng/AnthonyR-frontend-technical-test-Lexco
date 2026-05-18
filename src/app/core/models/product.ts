import {
  ApiResponse,
  BooleanQueryValue,
  DecimalString,
  IsoDateString,
  PaginatedApiResponse,
  PaginationQuery,
  RequireAtLeastOne,
} from './api-response';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: DecimalString;
  stock: number;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export type CatalogProduct = Pick<Product, 'id' | 'name' | 'description' | 'category' | 'price' | 'stock'>;

export type ProductResponse = ApiResponse<Product>;

export type ProductsResponse = PaginatedApiResponse<Product>;

export type CatalogProductResponse = ApiResponse<CatalogProduct>;

export type CatalogProductsResponse = PaginatedApiResponse<CatalogProduct>;

export interface ProductListQuery extends PaginationQuery {
  search?: string;
  category?: string;
  in_stock?: BooleanQueryValue;
}

export interface CatalogProductListQuery extends PaginationQuery {
  search?: string;
  category?: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  category: string;
  price: number | DecimalString;
  stock: number;
}

export type UpdateProductPayload = RequireAtLeastOne<Partial<CreateProductPayload>>;
