import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly cartService = inject(CartService);
  protected readonly items = this.cartService.items;
  protected readonly totalItems = this.cartService.totalItems;
  protected readonly totalAmount = this.cartService.totalAmount;

  protected addOne(productId: number): void {
    const item = this.items().find((entry) => entry.product.id === productId);

    if (item) {
      this.cartService.addProduct(item.product);
    }
  }

  protected decrement(productId: number): void {
    this.cartService.decrement(productId);
  }

  protected remove(productId: number): void {
    this.cartService.remove(productId);
  }

  protected clear(): void {
    this.cartService.clear();
  }

  protected formatPrice(price: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(price));
  }

  protected subtotal(price: string | number, quantity: number): string {
    return this.formatPrice(Number(price) * quantity);
  }
}
