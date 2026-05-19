import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';

import { UserManagementPage } from './user-management.page';
import { User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';

describe('UserManagementPage', () => {
  let fixture: ComponentFixture<UserManagementPage>;
  let httpController: HttpTestingController;
  let router: Router;
  let authService: { user: ReturnType<typeof signal<User | null>>; clearSession: ReturnType<typeof vi.fn> };

  const adminUser: User = {
    id: 1,
    name: 'Laura Alvarez',
    email: 'laura.alvarez@empresa.com',
    role: 'admin',
    created_at: '2026-05-18T12:21:07.000000Z',
    updated_at: '2026-05-18T12:21:07.000000Z',
  };

  const regularUser: User = {
    id: 2,
    name: 'Carlos Mendez',
    email: 'cmendez@empresa.com',
    role: 'user',
    created_at: '2026-05-18T13:21:07.000000Z',
    updated_at: '2026-05-18T13:21:07.000000Z',
  };

  beforeEach(async () => {
    authService = {
      user: signal<User | null>(adminUser),
      clearSession: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementPage);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('loads and renders paginated users', () => {
    fixture.detectChanges();

    const request = expectUsersRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('per_page')).toBe('12');

    request.flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Laura Alvarez');
    expect(fixture.nativeElement.textContent).toContain('Carlos Mendez');
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 1');
  });

  it('applies search and role filters', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const roleSelect = fixture.nativeElement.querySelector('.users-role-filter select') as HTMLSelectElement;

    searchInput.value = 'Laura';
    searchInput.dispatchEvent(new Event('input'));
    roleSelect.value = 'admin';
    roleSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = expectUsersRequest();

    expect(request.request.params.get('search')).toBe('Laura');
    expect(request.request.params.get('role')).toBe('admin');

    request.flush(usersResponse([adminUser]));
  });

  it('clears active filters and reloads users without filter params', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    const roleSelect = fixture.nativeElement.querySelector('.users-role-filter select') as HTMLSelectElement;

    searchInput.value = 'Carlos';
    searchInput.dispatchEvent(new Event('input'));
    roleSelect.value = 'user';
    roleSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expectUsersRequest().flush(usersResponse([regularUser]));
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('.users-filters .users-secondary-button') as HTMLButtonElement;

    expect(clearButton.disabled).toBe(false);

    clearButton.click();

    const request = expectUsersRequest();

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('search')).toBeNull();
    expect(request.request.params.get('role')).toBeNull();
    expect((fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('');
    expect((fixture.nativeElement.querySelector('.users-role-filter select') as HTMLSelectElement).value).toBe('');

    request.flush(usersResponse([adminUser, regularUser]));
  });

  it('creates a user and refreshes the list', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.users-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    setField('name', 'Sofia Rios');
    setField('email', 's.rios@empresa.com');
    setField('role', 'user');
    setField('password', 'Password*123');
    setField('password_confirmation', 'Password*123');

    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const createRequest = httpController.expectOne('http://localhost/api/users');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Sofia Rios',
      email: 's.rios@empresa.com',
      role: 'user',
      password: 'Password*123',
      password_confirmation: 'Password*123',
    });

    createRequest.flush({ data: { ...regularUser, id: 3, name: 'Sofia Rios' }, message: 'User created successfully' });
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
  });

  it('preloads edit data and omits empty password fields when updating', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    const editButtons = Array.from(fixture.nativeElement.querySelectorAll('.user-card__action')) as HTMLButtonElement[];
    editButtons[2].click();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.users-form input[formcontrolname="name"]') as HTMLInputElement).value).toBe(
      'Carlos Mendez',
    );
    expect((fixture.nativeElement.querySelector('.users-form input[formcontrolname="email"]') as HTMLInputElement).value).toBe(
      'cmendez@empresa.com',
    );

    setField('name', 'Carlos Mendez Updated');
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const updateRequest = httpController.expectOne('http://localhost/api/users/2');

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      name: 'Carlos Mendez Updated',
      email: 'cmendez@empresa.com',
      role: 'user',
    });

    updateRequest.flush({ data: { ...regularUser, name: 'Carlos Mendez Updated' }, message: 'User updated successfully' });
    expectUsersRequest().flush(usersResponse([adminUser, { ...regularUser, name: 'Carlos Mendez Updated' }]));
  });

  it('does not allow changing own role or deleting self', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    const actionButtons = Array.from(fixture.nativeElement.querySelectorAll('.user-card__action')) as HTMLButtonElement[];

    expect(actionButtons[1].disabled).toBe(true);

    actionButtons[0].click();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.users-form select[formcontrolname="role"]') as HTMLSelectElement).disabled).toBe(
      true,
    );
  });

  it('deletes another user after confirmation and refreshes the list', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser, regularUser]));
    fixture.detectChanges();

    const actionButtons = Array.from(fixture.nativeElement.querySelectorAll('.user-card__action')) as HTMLButtonElement[];
    actionButtons[3].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('¿Seguro que quieres eliminar');

    (fixture.nativeElement.querySelector('.users-danger-button') as HTMLButtonElement).click();

    const deleteRequest = httpController.expectOne('http://localhost/api/users/2');

    expect(deleteRequest.request.method).toBe('DELETE');

    deleteRequest.flush(null);
    expectUsersRequest().flush(usersResponse([adminUser]));
  });

  it('maps backend validation errors to form fields', () => {
    fixture.detectChanges();
    expectUsersRequest().flush(usersResponse([adminUser]));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.users-fab') as HTMLButtonElement).click();
    fixture.detectChanges();

    setField('name', 'Invalid User');
    setField('email', 'invalid@example.com');
    setField('role', 'user');
    setField('password', 'Password*123');
    setField('password_confirmation', 'Password*123');
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    httpController.expectOne('http://localhost/api/users').flush(
      { message: 'Validation failed', errors: { email: ['The email has already been taken.'] } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The email has already been taken.');
  });

  it('redirects to login when list request returns 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();

    expectUsersRequest().flush(
      { message: 'Unauthenticated.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authService.clearSession).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });

  function expectUsersRequest() {
    return httpController.expectOne((request) => request.url === 'http://localhost/api/users' && request.method === 'GET');
  }

  function usersResponse(users: User[]) {
    return {
      data: users,
      meta: { current_page: 1, per_page: 12, total: users.length, last_page: 1 },
      message: 'Operation completed successfully',
    };
  }

  function getForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('.users-form') as HTMLFormElement;
  }

  function setField(name: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`.users-form [formcontrolname="${name}"]`) as
      | HTMLInputElement
      | HTMLSelectElement;

    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }
});
