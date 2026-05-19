import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PaginationMeta } from '../../core/models/api-response';
import { CatalogProduct } from '../../core/models/product';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ProductsService } from '../../core/services/products.service';

@Component({
  selector: 'app-catalog-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly listError = signal<string | null>(null);
  protected readonly feedbackMessages = signal<Record<number, string>>({});
  protected readonly cartItemCount = this.cartService.totalItems;
  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: '',
    category: '',
  });

  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filtersForm.getRawValue();
    return Boolean(filters.search.trim() || filters.category.trim());
  });

  ngOnInit(): void {
    this.loadProducts(1);
  }

  protected applyFilters(): void {
    this.loadProducts(1);
  }

  protected clearFilters(): void {
    this.filtersForm.reset({ search: '', category: '' });
    this.loadProducts(1);
  }

  protected goToPage(page: number): void {
    const meta = this.pagination();

    if (!meta || page < 1 || page > meta.last_page || page === meta.current_page) {
      return;
    }

    this.loadProducts(page);
  }

  protected addToCart(product: CatalogProduct): void {
    const result = this.cartService.addProduct(product);

    if (result === 'unavailable') {
      this.setProductFeedback(product.id, 'Producto sin stock disponible.');
      return;
    }

    if (result === 'maxed') {
      this.setProductFeedback(product.id, 'Ya alcanzaste el stock disponible para este producto.');
      return;
    }

    this.setProductFeedback(product.id, `Agregado al carrito. En carrito: ${this.cartQuantity(product.id)}.`);
  }

  protected cartQuantity(productId: number): number {
    return this.cartService.quantityFor(productId);
  }

  protected stockLabel(stock: number): string {
    if (stock <= 0) {
      return 'Sin stock';
    }

    if (stock <= 5) {
      return `Ultimas ${stock} unidades`;
    }

    return 'Disponible';
  }

  protected formatPrice(price: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(price));
  }

  private loadProducts(page: number): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading.set(true);
    this.listError.set(null);

    this.productsService
      .listAvailable({
        page,
        per_page: 9,
        search: filters.search.trim() || undefined,
        category: filters.category.trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.pagination.set(response.meta);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.handleRequestError(error);
        },
      });
  }

  private handleRequestError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.authService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 403) {
      this.listError.set('No tienes permisos para ver el catálogo en este momento.');
      return;
    }

    this.listError.set('No pudimos cargar el catálogo. Inténtalo nuevamente.');
  }

  private setProductFeedback(productId: number, message: string): void {
    this.feedbackMessages.update((messages) => ({
      ...messages,
      [productId]: message,
    }));
  }
}
