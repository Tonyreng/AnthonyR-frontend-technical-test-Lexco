import { ApiResponse, DecimalString } from './api-response';

export type PurchaseStatus = 'completed';

export interface PurchaseItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreatePurchasePayload {
  items: PurchaseItemPayload[];
}

export interface PurchaseItemResponse {
  product_id: number;
  quantity: number;
  unit_price: DecimalString;
  subtotal: DecimalString;
}

export interface PurchaseResponse {
  id: number;
  user_id: number;
  total: DecimalString;
  status: PurchaseStatus;
  items: PurchaseItemResponse[];
}

export type CreatePurchaseResponse = ApiResponse<PurchaseResponse>;
