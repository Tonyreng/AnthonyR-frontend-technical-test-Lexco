import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { App } from './app';
import { User } from './core/models';
import { AuthService } from './core/services/auth.service';

@Component({ template: '' })
class EmptyRouteComponent {}

describe('App', () => {
  let authService: {
    user: ReturnType<typeof signal<User | null>>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      user: signal<User | null>({
        id: 1,
        name: 'GestionPro',
        email: 'admin@gestionpro.com',
        role: 'admin',
        created_at: '2026-05-17T00:00:00.000000Z',
        updated_at: '2026-05-17T00:00:00.000000Z',
      }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'auth/login', component: EmptyRouteComponent },
          { path: 'admin', component: EmptyRouteComponent },
          { path: 'admin/users', component: EmptyRouteComponent },
          { path: 'admin/products', component: EmptyRouteComponent },
          { path: 'admin/profile', component: EmptyRouteComponent },
          { path: 'catalog', component: EmptyRouteComponent },
          { path: 'cart', component: EmptyRouteComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('always renders the global header brand', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-header__brand')?.textContent).toContain('GestionPro');
  });

  it('does not render logout or sidebar on public auth pages', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/auth/login');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-header__logout')).toBeFalsy();
    expect(compiled.querySelector('.app-sidebar')).toBeFalsy();
  });

  it('does not render private navigation on initial auth page refresh', () => {
    const location = TestBed.inject(Location);

    location.go('/auth/login');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-header__logout')).toBeFalsy();
    expect(compiled.querySelector('.app-sidebar')).toBeFalsy();
  });

  it('renders logout and sidebar on private pages', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.app-header__logout')).toBeTruthy();
    expect(compiled.querySelector('.app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('.app-sidebar__link')?.textContent).toContain('Dashboard');
  });

  it('shows the authenticated user role in the sidebar', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/admin');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-sidebar__role')?.textContent).toContain('Administrador');
  });

  it('collapses and expands the private sidebar', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const collapseButton = compiled.querySelector('.app-sidebar__collapse') as HTMLButtonElement;

    collapseButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.app-sidebar--collapsed')).toBeTruthy();
    expect(compiled.querySelector('.app-sidebar__open')).toBeTruthy();
    expect(compiled.querySelector('.app-sidebar__open .pi-angle-right')).toBeTruthy();

    (compiled.querySelector('.app-sidebar__open') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.app-sidebar--collapsed')).toBeFalsy();
    expect(compiled.querySelector('.app-sidebar__collapse')).toBeTruthy();
  });

  it('logs out and redirects authenticated users to login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    authService.logout.mockReturnValue(of(undefined));

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__logout') as HTMLButtonElement).click();

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to login when logout resolves after a 401', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    authService.logout.mockReturnValue(of(undefined));

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__logout') as HTMLButtonElement).click();

    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  it('shows an error message when logout fails unexpectedly', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    authService.logout.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    await router.navigateByUrl('/catalog');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__logout') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cerrar tu sesión en este momento.');
  });
});
