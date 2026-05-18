import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';

import { getDefaultRouteForUser } from '../../../core/auth/auth-redirect';
import { ValidationErrorResponse } from '../../../core/models';
import { LoginPayload } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';

type LoginField = keyof LoginPayload;

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly isPasswordVisible = signal(false);

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    this.watchFieldChanges('email');
    this.watchFieldChanges('password');
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((visible) => !visible);
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    this.generalError.set(null);
    this.clearAllServerErrors();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          void this.router.navigateByUrl(getDefaultRouteForUser(user));
        },
        error: (error: HttpErrorResponse) => {
          this.handleLoginError(error);
        },
      });
  }

  isFieldInvalid(field: LoginField): boolean {
    const control = this.loginForm.controls[field];

    return control.invalid && (control.touched || this.submitAttempted());
  }

  getFieldError(field: LoginField): string | null {
    const control = this.loginForm.controls[field];
    const errors = control.errors;

    if (!this.isFieldInvalid(field) || !errors) {
      return null;
    }

    if (errors['server']) {
      return errors['server'];
    }

    if (errors['required']) {
      return 'Este campo es obligatorio.';
    }

    if (errors['email']) {
      return 'Ingresa un correo electrónico válido.';
    }

    return null;
  }

  private watchFieldChanges(field: LoginField): void {
    this.loginForm.controls[field].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearServerError(field);

        if (this.generalError()) {
          this.generalError.set(null);
        }
      });
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.generalError.set('Credenciales inválidas.');

      return;
    }

    if (error.status === 422) {
      const payload = error.error as ValidationErrorResponse;
      const fieldErrors = payload.errors ?? {};

      (Object.entries(fieldErrors) as Array<[string, string[]]>).forEach(([field, messages]) => {
        if (this.isLoginField(field)) {
          const control = this.loginForm.controls[field];

          control.setErrors({ ...(control.errors ?? {}), server: messages[0] });
          control.markAsTouched();
        }
      });

      const hasMappedErrors = Object.keys(fieldErrors).some((field) => this.isLoginField(field));

      if (!hasMappedErrors || !payload.errors) {
        this.generalError.set(payload.message || 'Revisa la información del formulario e inténtalo nuevamente.');
      }

      return;
    }

    this.generalError.set('No pudimos iniciar tu sesión en este momento. Inténtalo nuevamente.');
  }

  private clearAllServerErrors(): void {
    this.clearServerError('email');
    this.clearServerError('password');
  }

  private clearServerError(field: LoginField): void {
    const control = this.loginForm.controls[field];

    if (!control.errors?.['server']) {
      return;
    }

    const { server, ...rest } = control.errors;
    void server;

    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private isLoginField(field: string): field is LoginField {
    return field === 'email' || field === 'password';
  }
}
