import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { PaginationMeta, ValidationErrorResponse } from '../../../core/models/api-response';
import { CreateUserPayload, Role, UpdateUserPayload, User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';

type UserFormMode = 'none' | 'create' | 'edit';

const passwordConfirmationValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const group = control as FormGroup;
  const password = String(group.get('password')?.value ?? '');
  const confirmation = String(group.get('password_confirmation')?.value ?? '');

  if (!password && !confirmation) {
    return null;
  }

  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-user-management-page',
  imports: [ReactiveFormsModule],
  templateUrl: './user-management.page.html',
  styleUrl: './user-management.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);

  private readonly passwordPolicyValidators = [
    Validators.minLength(8),
    Validators.pattern(/[A-Z]/),
    Validators.pattern(/[a-z]/),
    Validators.pattern(/[0-9]/),
    Validators.pattern(/[^A-Za-z0-9]/),
  ];

  protected readonly users = signal<User[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly listError = signal<string | null>(null);
  protected readonly operationError = signal<string | null>(null);
  protected readonly formMode = signal<UserFormMode>('none');
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly pendingDeleteUser = signal<User | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly deletingUserId = signal<number | null>(null);
  protected readonly submitAttempted = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly currentUser = computed(() => this.authService.user());
  protected readonly isFormOpen = computed(() => this.formMode() !== 'none');
  protected readonly formTitle = computed(() => (this.formMode() === 'edit' ? 'Editar usuario' : 'Crear usuario'));
  protected readonly formSubtitle = computed(() =>
    this.formMode() === 'edit'
      ? 'Actualiza los datos actuales sin exponer contraseñas existentes.'
      : 'Crea una cuenta con rol y contraseña segura.',
  );

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: '',
    role: '' as Role | '',
  });

  protected readonly userForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user' as Role, [Validators.required]],
      password: [''],
      password_confirmation: [''],
    },
    { validators: passwordConfirmationValidator },
  );

  ngOnInit(): void {
    this.loadUsers(1);
  }

  protected applyFilters(): void {
    this.loadUsers(1);
  }

  protected goToPage(page: number): void {
    const meta = this.pagination();

    if (!meta || page < 1 || page > meta.last_page || page === meta.current_page) {
      return;
    }

    this.loadUsers(page);
  }

  protected openCreateForm(): void {
    this.serverErrors.set({});
    this.operationError.set(null);
    this.submitAttempted.set(false);
    this.selectedUser.set(null);
    this.formMode.set('create');
    this.userForm.enable({ emitEvent: false });
    this.userForm.reset({
      name: '',
      email: '',
      role: 'user',
      password: '',
      password_confirmation: '',
    });
    this.configurePasswordFields(true);
  }

  protected openEditForm(user: User): void {
    this.serverErrors.set({});
    this.operationError.set(null);
    this.submitAttempted.set(false);
    this.selectedUser.set(user);
    this.formMode.set('edit');
    this.userForm.enable({ emitEvent: false });
    this.userForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      password_confirmation: '',
    });

    if (this.isCurrentUser(user)) {
      this.userForm.controls.role.disable({ emitEvent: false });
    }

    this.configurePasswordFields(false);
  }

  protected closeForm(): void {
    this.formMode.set('none');
    this.selectedUser.set(null);
    this.submitAttempted.set(false);
    this.serverErrors.set({});
    this.operationError.set(null);
    this.userForm.reset();
  }

  protected submitUserForm(): void {
    this.submitAttempted.set(true);
    this.serverErrors.set({});
    this.operationError.set(null);
    this.userForm.markAllAsTouched();

    if (this.userForm.invalid) {
      return;
    }

    const mode = this.formMode();

    if (mode === 'create') {
      this.createUser();
      return;
    }

    if (mode === 'edit') {
      this.updateUser();
    }
  }

  protected requestDelete(user: User): void {
    if (!this.canDelete(user)) {
      return;
    }

    this.operationError.set(null);
    this.pendingDeleteUser.set(user);
  }

  protected cancelDelete(): void {
    this.pendingDeleteUser.set(null);
  }

  protected confirmDelete(): void {
    const user = this.pendingDeleteUser();

    if (!user || !this.canDelete(user)) {
      return;
    }

    this.deletingUserId.set(user.id);
    this.operationError.set(null);

    this.usersService
      .delete(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.pendingDeleteUser.set(null);
          this.deletingUserId.set(null);
          this.loadUsers(this.pagination()?.current_page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.deletingUserId.set(null);
          this.handleRequestError(error, 'No pudimos eliminar el usuario.');
        },
      });
  }

  protected canDelete(user: User): boolean {
    return !this.isCurrentUser(user);
  }

  protected isCurrentUser(user: User | null): boolean {
    return user !== null && this.currentUser()?.id === user.id;
  }

  protected roleLabel(role: Role): string {
    return role === 'admin' ? 'Admin' : 'User';
  }

  protected userInitials(user: User): string {
    return user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  protected fieldError(field: keyof typeof this.userForm.controls): string | null {
    const serverError = this.serverErrors()[field];

    if (serverError) {
      return serverError;
    }

    const control = this.userForm.controls[field];
    const shouldShow = control.invalid && (control.touched || this.submitAttempted());

    if (field === 'password_confirmation' && this.userForm.errors?.['passwordMismatch'] && shouldShow) {
      return 'Las contraseñas no coinciden.';
    }

    if (!shouldShow) {
      return null;
    }

    if (control.errors?.['required']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors?.['email']) {
      return 'Ingresa un email válido.';
    }

    if (field === 'password' && (control.errors?.['minlength'] || control.errors?.['pattern'])) {
      return 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.';
    }

    return null;
  }

  private loadUsers(page: number): void {
    const filters = this.filtersForm.getRawValue();

    this.isLoading.set(true);
    this.listError.set(null);

    this.usersService
      .list({
        page,
        per_page: 6,
        search: filters.search.trim() || undefined,
        role: filters.role || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.users.set(response.data);
          this.pagination.set(response.meta);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.handleRequestError(error, 'No pudimos cargar los usuarios.', true);
        },
      });
  }

  private createUser(): void {
    const raw = this.userForm.getRawValue();
    const payload: CreateUserPayload = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      role: raw.role,
      password: raw.password,
      password_confirmation: raw.password_confirmation,
    };

    this.isSubmitting.set(true);

    this.usersService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeForm();
          this.loadUsers(1);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleRequestError(error, 'No pudimos crear el usuario.');
        },
      });
  }

  private updateUser(): void {
    const user = this.selectedUser();

    if (!user) {
      return;
    }

    const raw = this.userForm.getRawValue();
    const payload: UpdateUserPayload = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      role: raw.role,
    };

    if (raw.password.trim()) {
      payload.password = raw.password;
      payload.password_confirmation = raw.password_confirmation;
    }

    this.isSubmitting.set(true);

    this.usersService
      .update(user.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeForm();
          this.loadUsers(this.pagination()?.current_page ?? 1);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleRequestError(error, 'No pudimos actualizar el usuario.');
        },
      });
  }

  private configurePasswordFields(isRequired: boolean): void {
    this.userForm.controls.password.setValidators([
      ...(isRequired ? [Validators.required] : []),
      ...this.passwordPolicyValidators,
    ]);
    this.userForm.controls.password_confirmation.setValidators(isRequired ? [Validators.required] : []);
    this.userForm.controls.password.updateValueAndValidity({ emitEvent: false });
    this.userForm.controls.password_confirmation.updateValueAndValidity({ emitEvent: false });
  }

  private handleRequestError(error: HttpErrorResponse, fallbackMessage: string, isListError = false): void {
    if (error.status === 401) {
      this.authService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 403) {
      void this.router.navigateByUrl('/catalog');
      return;
    }

    if (error.status === 422) {
      this.mapServerErrors(error);
      return;
    }

    if (isListError) {
      this.listError.set(fallbackMessage);
    } else {
      this.operationError.set(fallbackMessage);
    }
  }

  private mapServerErrors(error: HttpErrorResponse): void {
    const response = error.error as ValidationErrorResponse | null;
    const errors = response?.errors ?? {};
    const mappedErrors = Object.entries(errors).reduce<Record<string, string>>((result, [field, messages]) => {
      result[field] = messages[0] ?? 'Dato inválido.';
      return result;
    }, {});

    this.serverErrors.set(mappedErrors);
  }
}
