export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string | number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export type CatalogProduct = Pick<Product, 'id' | 'name' | 'description' | 'category' | 'price' | 'stock'>;
