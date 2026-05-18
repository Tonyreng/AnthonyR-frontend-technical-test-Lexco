import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterPage } from './register.page';

@Component({ template: '' })
class EmptyRouteComponent {}

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authService: { register: ReturnType<typeof vi.fn> };
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
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([
          { path: 'admin', component: EmptyRouteComponent },
          { path: 'catalog', component: EmptyRouteComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders the registration form with required fields', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#register-title')?.textContent).toContain('Crear nueva cuenta');
    expect(compiled.querySelector<HTMLInputElement>('#name')).toBeTruthy();
    expect(compiled.querySelector<HTMLInputElement>('#email')).toBeTruthy();
    expect(compiled.querySelector<HTMLInputElement>('#password')).toBeTruthy();
    expect(compiled.querySelector<HTMLInputElement>('#password_confirmation')).toBeTruthy();
  });

  it('does not submit an invalid empty form and shows required errors', () => {
    const form = getFormElement();

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Este campo es obligatorio.');
    expect(fixture.nativeElement.textContent).toContain('Debes confirmar tu contraseña.');
  });

  it('updates password requirement states while typing', () => {
    component.registerForm.controls.password.setValue('Password*123');
    fixture.detectChanges();

    const validRules = fixture.nativeElement.querySelectorAll('.register-form__rules .is-valid');

    expect(validRules.length).toBe(5);
  });

  it('submits valid registration data without sending role and redirects admins', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authService.register.mockReturnValue(of(adminUser));

    component.registerForm.setValue({
      name: 'Ana Martínez',
      email: 'ana@empresa.com',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Ana Martínez',
      email: 'ana@empresa.com',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });
    expect(authService.register.mock.calls[0][0]).not.toHaveProperty('role');
    expect(navigateSpy).toHaveBeenCalledWith('/admin');
  });

  it('submits when the native form submit event is emitted', () => {
    authService.register.mockReturnValue(of({ ...adminUser, role: 'user' }));
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.registerForm.setValue({
      name: 'Ana Martínez',
      email: 'ana@empresa.com',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(authService.register).toHaveBeenCalledTimes(1);
  });

  it('maps backend validation errors to form fields', () => {
    authService.register.mockReturnValue(
      throwError(() =>
        new HttpErrorResponse({
          status: 422,
          error: {
            message: 'The email has already been taken.',
            errors: {
              email: ['The email has already been taken.'],
            },
          },
        }),
      ),
    );

    component.registerForm.setValue({
      name: 'Ana Martínez',
      email: 'ana@empresa.com',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(component.registerForm.controls.email.errors?.['server']).toBe('The email has already been taken.');
    expect(fixture.nativeElement.textContent).toContain('The email has already been taken.');
  });

  it('shows a general message for unexpected registration errors', () => {
    authService.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.registerForm.setValue({
      name: 'Ana Martínez',
      email: 'ana@empresa.com',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });

    getFormElement().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos crear tu cuenta en este momento.');
  });

  function getFormElement(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }
});
