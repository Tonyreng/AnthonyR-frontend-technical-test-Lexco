import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { AdminProfilePage } from './admin-profile.page';
import { User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminProfilePage', () => {
  let fixture: ComponentFixture<AdminProfilePage>;
  let httpController: HttpTestingController;
  let router: Router;
  let authService: {
    user: ReturnType<typeof signal<User | null>>;
    loadCurrentUser: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
    setCurrentUser: ReturnType<typeof vi.fn>;
  };

  const adminUser: User = {
    id: 1,
    name: 'Laura Alvarez',
    email: 'laura.alvarez@empresa.com',
    role: 'admin',
    created_at: '2026-05-18T12:21:07.000000Z',
    updated_at: '2026-05-18T12:21:07.000000Z',
  };

  beforeEach(async () => {
    authService = {
      user: signal<User | null>(adminUser),
      loadCurrentUser: vi.fn().mockReturnValue(of(adminUser)),
      clearSession: vi.fn(),
      setCurrentUser: vi.fn((user: User | null) => authService.user.set(user)),
    };

    await TestBed.configureTestingModule({
      imports: [AdminProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfilePage);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('renders current admin data in the profile page', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laura Alvarez');
    expect(fixture.nativeElement.textContent).toContain('laura.alvarez@empresa.com');
    expect(fixture.nativeElement.textContent).toContain('Administrador');
    expect((fixture.nativeElement.querySelector('input[formcontrolname="name"]') as HTMLInputElement).value).toBe('Laura Alvarez');
  });

  it('updates name and email without sending password fields when empty', () => {
    fixture.detectChanges();

    setField('name', 'Laura Admin');
    setField('email', 'laura.admin@empresa.com');

    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const updateRequest = httpController.expectOne('http://localhost/api/users/1');

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      name: 'Laura Admin',
      email: 'laura.admin@empresa.com',
      role: 'admin',
    });

    updateRequest.flush({
      data: { ...adminUser, name: 'Laura Admin', email: 'laura.admin@empresa.com' },
      message: 'User updated successfully',
    });
    fixture.detectChanges();

    expect(authService.setCurrentUser).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Perfil actualizado correctamente.');
  });

  it('updates password when password fields are provided', () => {
    fixture.detectChanges();

    setField('password', 'NewPassword*123');
    setField('password_confirmation', 'NewPassword*123');

    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const updateRequest = httpController.expectOne('http://localhost/api/users/1');

    expect(updateRequest.request.body).toEqual({
      name: 'Laura Alvarez',
      email: 'laura.alvarez@empresa.com',
      role: 'admin',
      password: 'NewPassword*123',
      password_confirmation: 'NewPassword*123',
    });

    updateRequest.flush({ data: adminUser, message: 'User updated successfully' });
  });

  it('shows a mismatch error when password confirmation does not match', () => {
    fixture.detectChanges();

    setField('password', 'NewPassword*123');
    setField('password_confirmation', 'Mismatch*123');

    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden.');
  });

  it('maps backend validation errors to profile fields', () => {
    fixture.detectChanges();

    setField('email', 'duplicated@empresa.com');
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    httpController.expectOne('http://localhost/api/users/1').flush(
      { message: 'Validation failed', errors: { email: ['The email has already been taken.'] } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The email has already been taken.');
  });

  it('redirects to login when profile update returns 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    setField('name', 'Laura Admin');
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    httpController.expectOne('http://localhost/api/users/1').flush(
      { message: 'Unauthenticated.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  function getForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('.profile-form') as HTMLFormElement;
  }

  function setField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.profile-form [formcontrolname="${name}"]`) as HTMLInputElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});
