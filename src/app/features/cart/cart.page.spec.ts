import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CartPage } from './cart.page';
import { CatalogProduct } from '../../core/models/product';
import { CartService } from '../../core/services/cart.service';

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let cartService: CartService;

  const product: CatalogProduct = {
    id: 1,
    name: 'Laptop Pro',
    description: 'Laptop de alto rendimiento',
    category: 'electronics',
    price: '1299.99',
    stock: 2,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [provideRouter([])],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    cartService.clear();
    fixture = TestBed.createComponent(CartPage);
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
});
