import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ProductsService } from '../../../core/services/products.service';
import { UsersService } from '../../../core/services/users.service';

interface DashboardMetricState {
  total: number | null;
  loading: boolean;
  error: string | null;
}

const createLoadingMetricState = (): DashboardMetricState => ({
  total: null,
  loading: true,
  error: null,
});

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly productsService = inject(ProductsService);
  private hasHandledAccessError = false;

  protected readonly usersMetric = signal<DashboardMetricState>(createLoadingMetricState());
  protected readonly productsMetric = signal<DashboardMetricState>(createLoadingMetricState());

  ngOnInit(): void {
    this.loadUsersTotal();
    this.loadProductsTotal();
  }

  protected formatTotal(total: number | null): string {
    return new Intl.NumberFormat('es-MX').format(total ?? 0);
  }

  private loadUsersTotal(): void {
    this.usersMetric.set(createLoadingMetricState());

    this.usersService
      .list({ per_page: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const total = response.meta?.total;

          if (typeof total !== 'number') {
            this.usersMetric.set({
              total: null,
              loading: false,
              error: 'No pudimos cargar el total de usuarios.',
            });

            return;
          }

          this.usersMetric.set({ total, loading: false, error: null });
        },
        error: (error: HttpErrorResponse) => {
          this.handleMetricError(error, this.usersMetric, 'No pudimos cargar el total de usuarios.');
        },
      });
  }

  private loadProductsTotal(): void {
    this.productsMetric.set(createLoadingMetricState());

    this.productsService
      .list({ per_page: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const total = response.meta?.total;

          if (typeof total !== 'number') {
            this.productsMetric.set({
              total: null,
              loading: false,
              error: 'No pudimos cargar el total de productos.',
            });

            return;
          }

          this.productsMetric.set({ total, loading: false, error: null });
        },
        error: (error: HttpErrorResponse) => {
          this.handleMetricError(error, this.productsMetric, 'No pudimos cargar el total de productos.');
        },
      });
  }

  private handleMetricError(
    error: HttpErrorResponse,
    metric: WritableSignal<DashboardMetricState>,
    fallbackMessage: string,
  ): void {
    if (!this.hasHandledAccessError && error.status === 401) {
      this.hasHandledAccessError = true;
      this.authService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (!this.hasHandledAccessError && error.status === 403) {
      this.hasHandledAccessError = true;
      void this.router.navigateByUrl('/catalog');
      return;
    }

    metric.set({
      total: null,
      loading: false,
      error: fallbackMessage,
    });
  }
}
