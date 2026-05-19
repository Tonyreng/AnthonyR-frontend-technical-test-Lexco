import { computed, Injectable, signal } from '@angular/core';

import { CatalogProduct } from '../models/product';

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export type AddToCartResult = 'added' | 'maxed' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItemsState = signal<CartItem[]>([]);

  readonly items = this.cartItemsState.asReadonly();
  readonly totalItems = computed(() => this.cartItemsState().reduce((total, item) => total + item.quantity, 0));
  readonly totalAmount = computed(() =>
    this.cartItemsState().reduce((total, item) => total + Number(item.product.price) * item.quantity, 0),
  );

  quantityFor(productId: number): number {
    return this.cartItemsState().find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  addProduct(product: CatalogProduct): AddToCartResult {
    if (product.stock <= 0) {
      return 'unavailable';
    }

    const currentQuantity = this.quantityFor(product.id);

    if (currentQuantity >= product.stock) {
      return 'maxed';
    }

    this.cartItemsState.update((items) => {
      const existingIndex = items.findIndex((item) => item.product.id === product.id);

      if (existingIndex === -1) {
        return [...items, { product, quantity: 1 }];
      }

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        product,
        quantity: updatedItems[existingIndex].quantity + 1,
      };

      return updatedItems;
    });

    return 'added';
  }

  decrement(productId: number): void {
    this.cartItemsState.update((items) => {
      const item = items.find((entry) => entry.product.id === productId);

      if (!item) {
        return items;
      }

      if (item.quantity <= 1) {
        return items.filter((entry) => entry.product.id !== productId);
      }

      return items.map((entry) =>
        entry.product.id === productId ? { ...entry, quantity: entry.quantity - 1 } : entry,
      );
    });
  }

  remove(productId: number): void {
    this.cartItemsState.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.cartItemsState.set([]);
  }
}
