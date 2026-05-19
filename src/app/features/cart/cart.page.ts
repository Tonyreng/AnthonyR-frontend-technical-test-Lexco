import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { CreatePurchasePayload, PurchaseResponse } from '../../core/models/purchase';
import { AuthService } from '../../core/services/auth.service';
import { CartItem, CartService } from '../../core/services/cart.service';
import { PurchasesService } from '../../core/services/purchases.service';

interface PurchaseSummary {
  items: CartItem[];
  total: string | number;
  purchase: PurchaseResponse;
}

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly purchasesService = inject(PurchasesService);
  protected readonly items = this.cartService.items;
  protected readonly totalItems = this.cartService.totalItems;
  protected readonly totalAmount = this.cartService.totalAmount;
  protected readonly isSubmitting = signal(false);
  protected readonly checkoutMessage = signal<string | null>(null);
  protected readonly checkoutError = signal<string | null>(null);
  protected readonly purchaseSummary = signal<PurchaseSummary | null>(null);
  protected readonly canCheckout = computed(() => this.items().length > 0 && !this.isSubmitting());

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
    this.checkoutMessage.set(null);
    this.checkoutError.set(null);
    this.purchaseSummary.set(null);
  }

  protected closePurchaseSummary(): void {
    this.purchaseSummary.set(null);
    this.checkoutMessage.set(null);
  }

  protected checkout(): void {
    if (!this.canCheckout()) {
      return;
    }

    const cartSnapshot = this.items().map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

    const payload: CreatePurchasePayload = {
      items: cartSnapshot.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    this.isSubmitting.set(true);
    this.checkoutMessage.set(null);
    this.checkoutError.set(null);
    this.purchaseSummary.set(null);

    this.purchasesService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.purchaseSummary.set({
            items: cartSnapshot,
            total: response.data.total,
            purchase: response.data,
          });
          this.cartService.clear();
          this.checkoutMessage.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleCheckoutError(error);
        },
      });
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

  protected summarySubtotal(item: CartItem): string {
    return this.subtotal(item.product.price, item.quantity);
  }

  private handleCheckoutError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.authService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 409) {
      this.checkoutError.set(error.error?.message ?? 'No pudimos finalizar la compra por un conflicto de stock.');
      return;
    }

    if (error.status === 422) {
      this.checkoutError.set(error.error?.message ?? 'Revisa los productos del carrito antes de finalizar la compra.');
      return;
    }

    this.checkoutError.set('No pudimos finalizar la compra. Inténtalo nuevamente.');
  }
}
