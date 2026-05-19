import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AdminDashboardPage } from './admin-dashboard.page';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminDashboardPage', () => {
  let fixture: ComponentFixture<AdminDashboardPage>;
  let router: Router;
  let httpController: HttpTestingController;
  let authService: { clearSession: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      clearSession: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPage);
    router = TestBed.inject(Router);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('renders loading states before totals are resolved', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Resumen del sistema');
    expect(fixture.nativeElement.querySelectorAll('.dashboard-skeleton').length).toBe(2);

    flushMetricRequest('/users', { total: 0 });
    flushMetricRequest('/products', { total: 0 });
  });

  it('uses paginated meta totals for users and products', () => {
    fixture.detectChanges();

    const usersRequest = expectMetricRequest('/users');
    const productsRequest = expectMetricRequest('/products');

    expect(usersRequest.request.params.get('per_page')).toBe('1');
    expect(productsRequest.request.params.get('per_page')).toBe('1');

    usersRequest.flush({
      data: [],
      meta: { current_page: 1, per_page: 1, total: 1248, last_page: 1 },
      message: 'Operation completed successfully',
    });
    productsRequest.flush({
      data: [],
      meta: { current_page: 1, per_page: 1, total: 3852, last_page: 1 },
      message: 'Operation completed successfully',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#dashboard-users-total')?.textContent).toContain('1,248');
    expect(fixture.nativeElement.querySelector('#dashboard-products-total')?.textContent).toContain('3,852');
  });

  it('shows an error in one card without blocking the other metric', () => {
    fixture.detectChanges();

    expectMetricRequest('/users').flush(
      { message: 'Server error' },
      { status: 500, statusText: 'Server Error' },
    );
    expectMetricRequest('/products').flush({
      data: [],
      meta: { current_page: 1, per_page: 1, total: 8, last_page: 1 },
      message: 'Operation completed successfully',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el total de usuarios.');
    expect(fixture.nativeElement.querySelector('#dashboard-products-total')?.textContent).toContain('8');
  });

  it('redirects to login and clears the session when a metric returns 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();

    expectMetricRequest('/users').flush(
      { message: 'Unauthenticated.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    flushMetricRequest('/products', { total: 8 });

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  function expectMetricRequest(pathname: '/users' | '/products') {
    return httpController.expectOne((request) => request.url === `http://localhost/api${pathname}`);
  }

  function flushMetricRequest(pathname: '/users' | '/products', meta: { total: number }): void {
    expectMetricRequest(pathname).flush({
      data: [],
      meta: { current_page: 1, per_page: 1, total: meta.total, last_page: 1 },
      message: 'Operation completed successfully',
    });
  }
});
