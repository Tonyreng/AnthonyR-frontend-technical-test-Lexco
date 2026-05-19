import { TestBed } from '@angular/core/testing';

import { CartService } from './cart.service';
import { CatalogProduct } from '../models/product';

describe('CartService', () => {
  let service: CartService;

  const product: CatalogProduct = {
    id: 1,
    name: 'Laptop Pro',
    description: 'Laptop de alto rendimiento',
    category: 'electronics',
    price: '1299.99',
    stock: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('adds a product and computes totals', () => {
    expect(service.addProduct(product)).toBe('added');

    expect(service.items()).toHaveLength(1);
    expect(service.totalItems()).toBe(1);
    expect(service.totalAmount()).toBe(1299.99);
  });

  it('increments existing product without exceeding stock', () => {
    expect(service.addProduct(product)).toBe('added');
    expect(service.addProduct(product)).toBe('added');
    expect(service.addProduct(product)).toBe('maxed');

    expect(service.quantityFor(product.id)).toBe(2);
  });

  it('removes unavailable products and clears the cart', () => {
    expect(service.addProduct({ ...product, id: 2, stock: 0 })).toBe('unavailable');
    expect(service.addProduct(product)).toBe('added');

    service.decrement(product.id);
    expect(service.items()).toEqual([]);

    service.addProduct(product);
    service.clear();
    expect(service.totalItems()).toBe(0);
  });
});
