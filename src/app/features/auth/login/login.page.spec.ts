import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { LoginPage } from './login.page';

@Component({ template: '' })
class EmptyRouteComponent {}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: Router;

  const adminUser: User = {
    id: 1,
    name: 'Ana Martínez',
    email: 'ana@empresa.com',
    role: 'admin',
    created_at: '2026-05-17T00:00:00.000000Z',
    updated_at: '2026-05-17T00:00:00.000000Z',
  };

  beforeEach(async () => {
    authService = {
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([
          { path: 'admin', component: EmptyRouteComponent },
          { path: 'catalog', component: EmptyRouteComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders the login form with email and password inputs', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#login-title')?.textContent).toContain('Ingresa a tu cuenta para continuar');
    expect(compiled.querySelector<HTMLInputElement>('#email')).toBeTruthy();
    expect(compiled.querySelector<HTMLInputElement>('#password')).toBeTruthy();
  });

  it('does not submit an invalid empty form and shows required errors', () => {
    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(authService.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Este campo es obligatorio.');
  });

  it('toggles password visibility', () => {
    const passwordInput = getPasswordInput();
    const toggleButton = fixture.nativeElement.querySelector('.login-form__toggle') as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');

    toggleButton.click();
    fixture.detectChanges();

    expect(getPasswordInput().type).toBe('text');

    toggleButton.click();
    fixture.detectChanges();

    expect(getPasswordInput().type).toBe('password');
  });

  it('submits valid login data and redirects admins', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authService.login.mockReturnValue(of(adminUser));

    component.loginForm.setValue({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(authService.login).toHaveBeenCalledWith({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });
    expect(navigateSpy).toHaveBeenCalledWith('/admin');
  });

  it('submits when the native form submit event is emitted', () => {
    authService.login.mockReturnValue(of({ ...adminUser, role: 'user' }));
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.loginForm.setValue({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  it('shows a general message for invalid credentials', () => {
    authService.login.mockReturnValue(
      throwError(() =>
        new HttpErrorResponse({
          status: 401,
          error: { message: 'Invalid credentials' },
        }),
      ),
    );

    component.loginForm.setValue({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Credenciales inválidas.');
  });

  it('maps backend validation errors to form fields', () => {
    authService.login.mockReturnValue(
      throwError(() =>
        new HttpErrorResponse({
          status: 422,
          error: {
            message: 'The email field is required.',
            errors: {
              email: ['The email field is required.'],
            },
          },
        }),
      ),
    );

    component.loginForm.setValue({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(component.loginForm.controls.email.errors?.['server']).toBe('The email field is required.');
    expect(fixture.nativeElement.textContent).toContain('The email field is required.');
  });

  it('shows a general message for unexpected login errors', () => {
    authService.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.loginForm.setValue({
      email: 'ana@empresa.com',
      password: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos iniciar tu sesión en este momento.');
  });

  function getFormElement(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function getPasswordInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#password') as HTMLInputElement;
  }
});
