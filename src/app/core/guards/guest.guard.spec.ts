import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { User } from '../models';
import { AuthService } from '../services/auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let authService: { loadCurrentUser: ReturnType<typeof vi.fn> };
  let router: Router;

  const baseUser: User = {
    id: 1,
    name: 'Ana Martínez',
    email: 'ana@empresa.com',
    role: 'user',
    created_at: '2026-05-17T00:00:00.000000Z',
    updated_at: '2026-05-17T00:00:00.000000Z',
  };

  beforeEach(() => {
    authService = {
      loadCurrentUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  it('allows unauthenticated users to access public auth routes', async () => {
    authService.loadCurrentUser.mockReturnValue(of(null));

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects authenticated admin users to the admin dashboard', async () => {
    authService.loadCurrentUser.mockReturnValue(of({ ...baseUser, role: 'admin' }));

    const result = await runGuard();

    expect(router.serializeUrl(result as UrlTree)).toBe('/admin');
  });

  it('redirects authenticated regular users to the catalog', async () => {
    authService.loadCurrentUser.mockReturnValue(of(baseUser));

    const result = await runGuard();

    expect(router.serializeUrl(result as UrlTree)).toBe('/catalog');
  });

  async function runGuard(): Promise<unknown> {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state)) as Observable<boolean | UrlTree>;

    return await firstValueFrom(result);
  }
});
