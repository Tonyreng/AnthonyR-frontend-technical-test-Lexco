import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { PaginationMeta, ValidationErrorResponse } from '../../../core/models/api-response';
import { CreateProductPayload, Product, UpdateProductPayload } from '../../../core/models/product';
import { AuthService } from '../../../core/services/auth.service';
import { ProductsService } from '../../../core/services/products.service';

type ProductFormMode = 'none' | 'create' | 'edit';

@Component({
  selector: 'app-product-management-page',
  imports: [ReactiveFormsModule],
  templateUrl: './product-management.page.html',
  styleUrl: './product-management.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagementPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly productsService = inject(ProductsService);

  protected readonly products = signal<Product[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly listError = signal<string | null>(null);
  protected readonly operationError = signal<string | null>(null);
  protected readonly formMode = signal<ProductFormMode>('none');
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly pendingDeleteProduct = signal<Product | null>(null);
  protected readonly detailTarget = signal<Product | null>(null);
  protected readonly detailProduct = signal<Product | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly deletingProductId = signal<number | null>(null);
  protected readonly submitAttempted = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly isFormOpen = computed(() => this.formMode() !== 'none');
  protected readonly isDetailOpen = computed(() => this.detailTarget() !== null);
  protected readonly formTitle = computed(() => (this.formMode() === 'edit' ? 'Editar producto' : 'Crear producto'));
  protected readonly formSubtitle = computed(() =>
    this.formMode() === 'edit'
      ? 'Actualiza la información actual del producto seleccionado.'
      : 'Crea un nuevo producto para el inventario administrable.',
  );

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: '',
    category: '',
    in_stock: '' as '' | 'true' | 'false',
  });

  protected readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    category: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  ngOnInit(): void {
    this.loadProducts(1);
  }

  protected applyFilters(): void {
    this.loadProducts(1);
  }

  protected goToPage(page: number): void {
    const meta = this.pagination();

    if (!meta || page < 1 || page > meta.last_page || page === meta.current_page) {
      return;
    }

    this.loadProducts(page);
  }

  protected openCreateForm(): void {
    this.serverErrors.set({});
    this.operationError.set(null);
    this.submitAttempted.set(false);
    this.selectedProduct.set(null);
    this.formMode.set('create');
    this.productForm.reset({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
    });
  }

  protected openEditForm(product: Product): void {
    this.serverErrors.set({});
    this.operationError.set(null);
    this.submitAttempted.set(false);
    this.selectedProduct.set(product);
    this.formMode.set('edit');
    this.productForm.reset({
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      stock: product.stock,
    });
  }

  protected closeForm(): void {
    this.formMode.set('none');
    this.selectedProduct.set(null);
    this.submitAttempted.set(false);
    this.serverErrors.set({});
    this.operationError.set(null);
    this.productForm.reset();
  }

  protected openDetail(product: Product): void {
    this.detailTarget.set(product);
    this.detailProduct.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    this.productsService
      .get(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.detailProduct.set(response.data);
          this.detailLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.detailLoading.set(false);
          this.handleRequestError(error, 'No pudimos cargar el detalle del producto.', false, true);
        },
      });
  }

  protected closeDetail(): void {
    this.detailTarget.set(null);
    this.detailProduct.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  protected requestDelete(product: Product): void {
    this.operationError.set(null);
    this.pendingDeleteProduct.set(product);
  }

  protected cancelDelete(): void {
    this.pendingDeleteProduct.set(null);
  }

  protected confirmDelete(): void {
    const product = this.pendingDeleteProduct();

    if (!product) {
      return;
    }

    this.deletingProductId.set(product.id);
    this.operationError.set(null);

    this.productsService
      .delete(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingDeleteProduct.set(null);
          this.deletingProductId.set(null);
          this.loadProducts(this.pagination()?.current_page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.deletingProductId.set(null);
          this.handleRequestError(error, 'No pudimos eliminar el producto.');
        },
      });
  }

  protected submitProductForm(): void {
    this.submitAttempted.set(true);
    this.serverErrors.set({});
    this.operationError.set(null);
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      return;
    }

    if (this.formMode() === 'create') {
      this.createProduct();
      return;
    }

    if (this.formMode() === 'edit') {
      this.updateProduct();
    }
  }

  protected fieldError(field: keyof typeof this.productForm.controls): string | null {
    const serverError = this.serverErrors()[field];

    if (serverError) {
      return serverError;
    }

    const control = this.productForm.controls[field];
    const shouldShow = control.invalid && (control.touched || this.submitAttempted());

    if (!shouldShow) {
      return null;
    }

    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors?.['min']) {
      return 'El valor debe ser mayor o igual a 0.';
    }

    if (field === 'stock' && control.errors?.['pattern']) {
      return 'El stock debe ser un número entero mayor o igual a 0.';
    }

    return null;
  }

  protected formatPrice(price: string | number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(price));
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  protected stockLabel(stock: number): string {
    return stock > 0 ? `Stock ${stock}` : 'Sin stock';
  }

  private loadProducts(page: number): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading.set(true);
    this.listError.set(null);

    this.productsService
      .list({
        page,
        per_page: 12,
        search: filters.search.trim() || undefined,
        category: filters.category.trim() || undefined,
        in_stock: filters.in_stock || undefined,
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
          this.handleRequestError(error, 'No pudimos cargar los productos.', true);
        },
      });
  }

  private createProduct(): void {
    const raw = this.productForm.getRawValue();
    const payload: CreateProductPayload = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      category: raw.category.trim(),
      price: raw.price,
      stock: raw.stock,
    };

    this.isSubmitting.set(true);

    this.productsService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeForm();
          this.loadProducts(1);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleRequestError(error, 'No pudimos crear el producto.');
        },
      });
  }

  private updateProduct(): void {
    const product = this.selectedProduct();

    if (!product) {
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: UpdateProductPayload = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      category: raw.category.trim(),
      price: raw.price,
      stock: raw.stock,
    };

    this.isSubmitting.set(true);

    this.productsService
      .update(product.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeForm();
          this.loadProducts(this.pagination()?.current_page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleRequestError(error, 'No pudimos actualizar el producto.');
        },
      });
  }

  private handleRequestError(
    error: HttpErrorResponse,
    fallbackMessage: string,
    isListError = false,
    isDetailError = false,
  ): void {
    if (error.status === 401) {
      this.authService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 403) {
      void this.router.navigateByUrl('/catalog');
      return;
    }

    if (error.status === 422) {
      this.mapServerErrors(error);
      return;
    }

    if (error.status === 409) {
      this.operationError.set(error.error?.message ?? fallbackMessage);
      return;
    }

    if (isDetailError) {
      this.detailError.set(error.error?.message ?? fallbackMessage);
      return;
    }

    if (isListError) {
      this.listError.set(error.error?.message ?? fallbackMessage);
    } else {
      this.operationError.set(error.error?.message ?? fallbackMessage);
    }
  }

  private mapServerErrors(error: HttpErrorResponse): void {
    const response = error.error as ValidationErrorResponse | null;
    const errors = response?.errors ?? {};
    const mappedErrors = Object.entries(errors).reduce<Record<string, string>>((result, [field, messages]) => {
      const message = messages[0] ?? 'Dato inválido.';

      if (field in this.productForm.controls) {
        result[field] = message;
      } else {
        this.operationError.set(message);
      }

      return result;
    }, {});

    this.serverErrors.set(mappedErrors);
  }
}
