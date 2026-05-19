import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { ValidationErrorResponse } from '../../../core/models/api-response';
import { UpdateUserPayload, User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';

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
  selector: 'app-admin-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-profile.page.html',
  styleUrl: './admin-profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfilePage implements OnInit {
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

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly operationError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly currentUser = computed(() => this.authService.user());
  protected readonly roleLabel = computed(() => (this.currentUser()?.role === 'admin' ? 'Administrador' : 'Usuario'));

  protected readonly profileForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.passwordPolicyValidators],
      password_confirmation: [''],
    },
    { validators: passwordConfirmationValidator },
  );

  ngOnInit(): void {
    const user = this.currentUser();

    if (user) {
      this.hydrateForm(user);
      this.isLoading.set(false);
      return;
    }

    this.authService
      .loadCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loadedUser) => {
        this.isLoading.set(false);

        if (!loadedUser) {
          this.loadError.set('No pudimos cargar tu perfil.');
          void this.router.navigateByUrl('/auth/login');
          return;
        }

        this.hydrateForm(loadedUser);
      });
  }

  protected submitProfileForm(): void {
    const user = this.currentUser();

    if (!user || this.isSubmitting()) {
      return;
    }

    this.submitAttempted.set(true);
    this.serverErrors.set({});
    this.operationError.set(null);
    this.successMessage.set(null);
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    const raw = this.profileForm.getRawValue();
    const trimmedName = raw.name.trim();
    const trimmedEmail = raw.email.trim();
    const password = raw.password.trim();

    if (trimmedName === user.name && trimmedEmail === user.email && !password) {
      this.successMessage.set('No hay cambios para guardar.');
      return;
    }

    const payload: UpdateUserPayload = {
      name: trimmedName,
      email: trimmedEmail,
      role: user.role,
    };

    if (password) {
      payload.password = raw.password;
      payload.password_confirmation = raw.password_confirmation;
    }

    this.isSubmitting.set(true);

    this.usersService
      .update(user.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.authService.setCurrentUser(response.data);
          this.hydrateForm(response.data);
          this.successMessage.set('Perfil actualizado correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleRequestError(error, 'No pudimos actualizar tu perfil.');
        },
      });
  }

  protected resetForm(): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.hydrateForm(user);
  }

  protected fieldError(field: keyof typeof this.profileForm.controls): string | null {
    const serverError = this.serverErrors()[field];

    if (serverError) {
      return serverError;
    }

    const control = this.profileForm.controls[field];
    const shouldShow = control.invalid && (control.touched || this.submitAttempted());

    if (field === 'password_confirmation' && this.profileForm.errors?.['passwordMismatch'] && (control.touched || this.submitAttempted())) {
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

  protected userInitials(): string {
    return this.currentUser()
      ?.name.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') ?? 'A';
  }

  private hydrateForm(user: User): void {
    this.profileForm.reset({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
    });
    this.serverErrors.set({});
    this.operationError.set(null);
    this.successMessage.set(null);
    this.submitAttempted.set(false);
    this.loadError.set(null);
  }

  private handleRequestError(error: HttpErrorResponse, fallbackMessage: string): void {
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

    this.operationError.set(fallbackMessage);
  }

  private mapServerErrors(error: HttpErrorResponse): void {
    const response = error.error as ValidationErrorResponse | null;
    const errors = response?.errors ?? {};
    const mappedErrors = Object.entries(errors).reduce<Record<string, string>>((result, [field, messages]) => {
      const message = messages[0] ?? 'Dato inválido.';

      if (field in this.profileForm.controls) {
        result[field] = message;
      } else {
        this.operationError.set(message);
      }

      return result;
    }, {});

    this.serverErrors.set(mappedErrors);
  }
}
