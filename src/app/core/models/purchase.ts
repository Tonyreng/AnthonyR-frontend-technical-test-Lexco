export interface PurchaseItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreatePurchasePayload {
  items: PurchaseItemPayload[];
}

export interface PurchaseResponse {
  id: number;
  user_id: number;
  total: string | number;
  status: string;
  created_at: string;
  updated_at: string;
}
