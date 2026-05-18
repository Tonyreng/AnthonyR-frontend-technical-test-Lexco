import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { finalize, filter } from 'rxjs';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly currentUrl = signal(this.router.url);

  protected readonly isSidebarCollapsed = signal(false);
  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly isPrivatePage = computed(() => !this.currentUrl().startsWith('/auth'));
  protected readonly sidebarUser = computed(() => this.authService.user());

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((isCollapsed) => !isCollapsed);
  }

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.logoutError.set(null);

    this.authService
      .logout()
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/auth/login');
        },
        error: (error: HttpErrorResponse) => {
          void error;
          this.logoutError.set('No pudimos cerrar tu sesión en este momento. Inténtalo nuevamente.');
        },
      });
  }
}
