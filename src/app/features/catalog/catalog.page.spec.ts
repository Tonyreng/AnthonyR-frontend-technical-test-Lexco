import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { CatalogPage } from './catalog.page';
import { CatalogProduct } from '../../core/models/product';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

describe('CatalogPage', () => {
  let fixture: ComponentFixture<CatalogPage>;
  let httpController: HttpTestingController;
  let router: Router;
  let authService: { user: ReturnType<typeof signal>; clearSession: ReturnType<typeof vi.fn> };
  let cartService: CartService;

  const productA: CatalogProduct = {
    id: 1,
    name: 'Laptop Pro',
    description: 'Laptop de alto rendimiento',
    category: 'electronics',
    price: '1299.99',
    stock: 2,
  };

  const productB: CatalogProduct = {
    id: 2,
    name: 'Office Chair',
    description: 'Silla ergonómica',
    category: 'furniture',
    price: '299.99',
    stock: 0,
  };

  beforeEach(async () => {
    authService = {
      user: signal({ id: 1, role: 'user' }),
      clearSession: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogPage);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  afterEach(() => {
    httpController.verify();
  });

  it('loads and renders available catalog products', () => {
    fixture.detectChanges();

    const request = expectCatalogRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('per_page')).toBe('9');

    request.flush(catalogResponse([productA, productB]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laptop Pro');
    expect(fixture.nativeElement.textContent).toContain('Ultimas 2 unidades');
    expect(fixture.nativeElement.textContent).toContain('Sin stock');
    expect((fixture.nativeElement.querySelector('[aria-label="Listado de productos disponibles"] button[disabled]') as HTMLButtonElement)).toBeTruthy();
  });

  it('applies search and category filters', () => {
    fixture.detectChanges();
    expectCatalogRequest().flush(catalogResponse([productA, productB]));
    fixture.detectChanges();

    setFilterField('search', 'laptop');
    setFilterField('category', 'electronics');
    getFiltersForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const request = expectCatalogRequest();

    expect(request.request.params.get('search')).toBe('laptop');
    expect(request.request.params.get('category')).toBe('electronics');

    request.flush(catalogResponse([productA]));
  });

  it('clears active filters and reloads the catalog without filter params', () => {
    fixture.detectChanges();
    expectCatalogRequest().flush(catalogResponse([productA, productB]));
    fixture.detectChanges();

    setFilterField('search', 'laptop');
    setFilterField('category', 'electronics');

    const clearButton = fixture.nativeElement.querySelector('.catalog-secondary-button') as HTMLButtonElement;

    expect(clearButton.disabled).toBe(false);

    clearButton.click();

    const request = expectCatalogRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('search')).toBeNull();
    expect(request.request.params.get('category')).toBeNull();
    expect((fixture.nativeElement.querySelector('.catalog-filters [formcontrolname="search"]') as HTMLInputElement).value).toBe('');
    expect((fixture.nativeElement.querySelector('.catalog-filters [formcontrolname="category"]') as HTMLInputElement).value).toBe('');

    request.flush(catalogResponse([productA, productB]));
  });

  it('adds products to the cart and prevents exceeding stock', () => {
    fixture.detectChanges();
    expectCatalogRequest().flush(catalogResponse([productA]));
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector('.catalog-primary-button') as HTMLButtonElement;

    addButton.click();
    fixture.detectChanges();

    expect(cartService.quantityFor(productA.id)).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('En carrito: 1');

    addButton.click();
    fixture.detectChanges();

    expect(cartService.quantityFor(productA.id)).toBe(2);
    expect((fixture.nativeElement.querySelector('.catalog-primary-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('redirects to login when catalog request returns 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();

    expectCatalogRequest().flush(
      { message: 'Unauthenticated.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  function expectCatalogRequest() {
    return httpController.expectOne((request) => request.url === 'http://localhost/api/catalog/products' && request.method === 'GET');
  }

  function catalogResponse(products: CatalogProduct[]) {
    return {
      data: products,
      meta: { current_page: 1, per_page: 9, total: products.length, last_page: 1 },
      message: 'Available products retrieved successfully',
    };
  }

  function setFilterField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.catalog-filters [formcontrolname="${name}"]`) as HTMLInputElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function getFiltersForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('.catalog-filters') as HTMLFormElement;
  }
});
