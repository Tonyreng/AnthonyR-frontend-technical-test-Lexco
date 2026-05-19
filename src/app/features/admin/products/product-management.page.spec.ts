import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { ProductManagementPage } from './product-management.page';
import { Product } from '../../../core/models/product';
import { AuthService } from '../../../core/services/auth.service';

describe('ProductManagementPage', () => {
  let fixture: ComponentFixture<ProductManagementPage>;
  let httpController: HttpTestingController;
  let router: Router;
  let authService: { user: ReturnType<typeof signal>; clearSession: ReturnType<typeof vi.fn> };

  const productA: Product = {
    id: 1,
    name: 'Laptop Pro',
    description: 'Laptop de alto rendimiento',
    category: 'electronics',
    price: '1299.99',
    stock: 12,
    created_at: '2026-05-18T12:21:07.000000Z',
    updated_at: '2026-05-18T12:21:07.000000Z',
  };

  const productB: Product = {
    id: 2,
    name: 'Office Chair',
    description: 'Silla ergonómica',
    category: 'furniture',
    price: '299.99',
    stock: 0,
    created_at: '2026-05-18T13:21:07.000000Z',
    updated_at: '2026-05-18T13:21:07.000000Z',
  };

  beforeEach(async () => {
    authService = {
      user: signal({ id: 1, role: 'admin' }),
      clearSession: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductManagementPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductManagementPage);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('loads and renders paginated products', () => {
    fixture.detectChanges();

    const request = expectProductsRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('per_page')).toBe('12');

    request.flush(productsResponse([productA, productB]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laptop Pro');
    expect(fixture.nativeElement.textContent).toContain('Office Chair');
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 1');
  });

  it('applies search, category and stock filters', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA, productB]));
    fixture.detectChanges();

    setFilterField('search', 'laptop');
    setFilterField('category', 'electronics');
    setStockFilter('true');

    const request = expectProductsRequest();

    expect(request.request.params.get('search')).toBe('laptop');
    expect(request.request.params.get('category')).toBe('electronics');
    expect(request.request.params.get('in_stock')).toBe('true');

    request.flush(productsResponse([productA]));
  });

  it('clears active filters and reloads products without filter params', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA, productB]));
    fixture.detectChanges();

    setFilterField('search', 'laptop');
    setFilterField('category', 'electronics');
    setStockFilter('true');

    expectProductsRequest().flush(productsResponse([productA]));
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('.products-filters .products-secondary-button') as HTMLButtonElement;

    expect(clearButton.disabled).toBe(false);

    clearButton.click();

    const request = expectProductsRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('search')).toBeNull();
    expect(request.request.params.get('category')).toBeNull();
    expect(request.request.params.get('in_stock')).toBeNull();
    expect((fixture.nativeElement.querySelector('.products-filters [formcontrolname="search"]') as HTMLInputElement).value).toBe('');
    expect((fixture.nativeElement.querySelector('.products-filters [formcontrolname="category"]') as HTMLInputElement).value).toBe('');
    expect((fixture.nativeElement.querySelector('.products-filters [formcontrolname="in_stock"]') as HTMLSelectElement).value).toBe('');

    request.flush(productsResponse([productA, productB]));
  });

  it('creates a product and refreshes the list', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.products-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    setFormField('name', 'Desk Lamp');
    setFormField('description', 'Lámpara LED');
    setFormField('category', 'lighting');
    setNumberField('price', '49.99');
    setNumberField('stock', '8');

    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const createRequest = httpController.expectOne('http://localhost/api/products');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Desk Lamp',
      description: 'Lámpara LED',
      category: 'lighting',
      price: 49.99,
      stock: 8,
    });

    createRequest.flush({ data: { ...productA, id: 3, name: 'Desk Lamp' }, message: 'Product created successfully' });
    expectProductsRequest().flush(productsResponse([productA, productB]));
  });

  it('preloads edit data and updates a product', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA, productB]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label="Editar Laptop Pro"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.products-form input[formcontrolname="name"]') as HTMLInputElement).value).toBe(
      'Laptop Pro',
    );

    setFormField('name', 'Laptop Pro Updated');
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const updateRequest = httpController.expectOne('http://localhost/api/products/1');

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      name: 'Laptop Pro Updated',
      description: 'Laptop de alto rendimiento',
      category: 'electronics',
      price: 1299.99,
      stock: 12,
    });

    updateRequest.flush({ data: { ...productA, name: 'Laptop Pro Updated' }, message: 'Product updated successfully' });
    expectProductsRequest().flush(productsResponse([{ ...productA, name: 'Laptop Pro Updated' }, productB]));
  });

  it('loads product detail in a modal', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label="Ver detalle de Laptop Pro"]') as HTMLButtonElement).click();

    const detailRequest = httpController.expectOne('http://localhost/api/products/1');

    expect(detailRequest.request.method).toBe('GET');

    detailRequest.flush({ data: productA, message: 'Product retrieved successfully' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laptop de alto rendimiento');
    expect(fixture.nativeElement.textContent).toContain('electronics');
  });

  it('shows a conflict message when product deletion is blocked', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label="Eliminar Laptop Pro"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.products-danger-button') as HTMLButtonElement).click();

    httpController.expectOne('http://localhost/api/products/1').flush(
      { message: 'Product cannot be deleted because it has associated purchase history.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Product cannot be deleted because it has associated purchase history.');
  });

  it('deletes a product and refreshes the list', () => {
    fixture.detectChanges();
    expectProductsRequest().flush(productsResponse([productA, productB]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[aria-label="Eliminar Office Chair"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.products-danger-button') as HTMLButtonElement).click();

    const deleteRequest = httpController.expectOne('http://localhost/api/products/2');

    expect(deleteRequest.request.method).toBe('DELETE');

    deleteRequest.flush(null);
    expectProductsRequest().flush(productsResponse([productA]));
  });

  it('redirects to login when product listing returns 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();

    expectProductsRequest().flush(
      { message: 'Unauthenticated.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  function expectProductsRequest() {
    return httpController.expectOne((request) => request.url === 'http://localhost/api/products' && request.method === 'GET');
  }

  function productsResponse(products: Product[]) {
    return {
      data: products,
      meta: { current_page: 1, per_page: 12, total: products.length, last_page: 1 },
      message: 'Products retrieved successfully',
    };
  }

  function getForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('.products-form') as HTMLFormElement;
  }

  function setFormField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.products-form [formcontrolname="${name}"]`) as
      | HTMLInputElement
      | HTMLTextAreaElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setNumberField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.products-form [formcontrolname="${name}"]`) as HTMLInputElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setFilterField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.products-filters [formcontrolname="${name}"]`) as HTMLInputElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setStockFilter(value: string): void {
    const field = fixture.nativeElement.querySelector('.products-filters [formcontrolname="in_stock"]') as HTMLSelectElement;

    field.value = value;
    field.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }
});
