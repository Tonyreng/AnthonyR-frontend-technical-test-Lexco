import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CartPage } from './cart.page';
import { CatalogProduct } from '../../core/models/product';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let cartService: CartService;
  let httpController: HttpTestingController;
  let router: Router;
  let authService: { clearSession: ReturnType<typeof vi.fn> };

  const product: CatalogProduct = {
    id: 1,
    name: 'Laptop Pro',
    description: 'Laptop de alto rendimiento',
    category: 'electronics',
    price: '1299.99',
    stock: 2,
  };

  beforeEach(async () => {
    authService = {
      clearSession: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    cartService.clear();
    fixture = TestBed.createComponent(CartPage);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('shows an empty cart state', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío');
  });

  it('renders cart items and lets the user adjust quantities', () => {
    cartService.addProduct(product);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laptop Pro');
    expect(fixture.nativeElement.textContent).toContain('1 productos');

    (fixture.nativeElement.querySelector('[aria-label="Aumentar cantidad"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cartService.quantityFor(product.id)).toBe(2);

    (fixture.nativeElement.querySelector('[aria-label="Reducir cantidad"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cartService.quantityFor(product.id)).toBe(1);
  });

  it('submits the checkout payload, clears the cart and shows the purchase summary modal on success', () => {
    cartService.addProduct(product);
    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();

    const request = expectPurchaseRequest();

    expect(request.request.body).toEqual({
      items: [{ product_id: product.id, quantity: 2 }],
    });

    request.flush({
      data: {
        id: 10,
        user_id: 5,
        total: '2599.98',
        status: 'completed',
        items: [{ product_id: product.id, quantity: 2, unit_price: '1299.99', subtotal: '2599.98' }],
      },
      message: 'Purchase completed successfully',
    });
    fixture.detectChanges();

    expect(cartService.totalItems()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Resumen de la compra');
    expect(fixture.nativeElement.textContent).toContain('Laptop Pro');
    expect(fixture.nativeElement.textContent).toContain('Cantidad: 2');
    expect(fixture.nativeElement.textContent).toContain('US$ 2.599,98');
    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío');
  });

  it('closes the purchase summary modal when the user confirms it', () => {
    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();

    expectPurchaseRequest().flush({
      data: {
        id: 10,
        user_id: 5,
        total: '1299.99',
        status: 'completed',
        items: [{ product_id: product.id, quantity: 1, unit_price: '1299.99', subtotal: '1299.99' }],
      },
      message: 'Purchase completed successfully',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Resumen de la compra');

    (fixture.nativeElement.querySelector('.cart-modal .cart-primary-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Resumen de la compra');
  });

  it('prevents duplicate checkout submissions while submitting', () => {
    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();
    fixture.detectChanges();
    checkoutButton().click();

    const requests = httpController.match('http://localhost/api/purchases');

    expect(requests).toHaveLength(1);

    requests[0].flush({
      data: { id: 10, user_id: 5, total: '1299.99', status: 'completed', items: [] },
      message: 'Purchase completed successfully',
    });
  });

  it('keeps the cart and shows the backend conflict message on 409', () => {
    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();

    expectPurchaseRequest().flush(
      { message: 'Stock insuficiente para Laptop Pro.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(cartService.totalItems()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Stock insuficiente para Laptop Pro.');
  });

  it('keeps the cart and shows a validation message on 422', () => {
    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();

    expectPurchaseRequest().flush({ message: 'Validation failed', errors: { items: ['Items inválidos.'] } }, { status: 422, statusText: 'Unprocessable Entity' });
    fixture.detectChanges();

    expect(cartService.totalItems()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Validation failed');
  });

  it('clears the session and redirects to login on 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    cartService.addProduct(product);
    fixture.detectChanges();

    checkoutButton().click();

    expectPurchaseRequest().flush({ message: 'Unauthenticated.' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
    expect(cartService.totalItems()).toBe(1);
  });

  function checkoutButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.cart-summary .cart-primary-button') as HTMLButtonElement;
  }

  function expectPurchaseRequest() {
    return httpController.expectOne((request) => request.url === 'http://localhost/api/purchases' && request.method === 'POST');
  }
});
