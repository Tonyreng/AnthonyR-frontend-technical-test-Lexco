import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';

import { getDefaultRouteForUser } from '../../../core/auth/auth-redirect';
import { ValidationErrorResponse } from '../../../core/models';
import { RegisterPayload } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';

type RegisterField = keyof RegisterPayload;

const PASSWORD_PATTERNS = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/,
};

function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value ?? '';

    if (!value) {
      return null;
    }

    const failedRules = Object.entries(PASSWORD_PATTERNS)
      .filter(([, pattern]) => !pattern.test(value))
      .map(([rule]) => rule);

    return failedRules.length > 0 ? { passwordStrength: failedRules } : null;
  };
}

function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmation = control.get('password_confirmation')?.value;

    if (!password || !confirmation) {
      return null;
    }

    return password === confirmation ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly submitAttempted = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly passwordValue = signal('');

  readonly registerForm = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
      password_confirmation: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator()],
    },
  );

  readonly passwordRuleStates = computed(() => {
    const password = this.passwordValue();

    return [
      { label: 'Mínimo 8 caracteres', fulfilled: PASSWORD_PATTERNS.minLength.test(password) },
      { label: 'Una letra mayúscula', fulfilled: PASSWORD_PATTERNS.uppercase.test(password) },
      { label: 'Una letra minúscula', fulfilled: PASSWORD_PATTERNS.lowercase.test(password) },
      { label: 'Un número', fulfilled: PASSWORD_PATTERNS.number.test(password) },
      { label: 'Un carácter especial', fulfilled: PASSWORD_PATTERNS.special.test(password) },
    ];
  });

  constructor() {
    this.watchFieldChanges('name');
    this.watchFieldChanges('email');
    this.watchFieldChanges('password');
    this.watchFieldChanges('password_confirmation');
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    this.generalError.set(null);
    this.clearAllServerErrors();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .register(this.registerForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          void this.router.navigateByUrl(getDefaultRouteForUser(user));
        },
        error: (error: HttpErrorResponse) => {
          this.handleRegisterError(error);
        },
      });
  }

  isFieldInvalid(field: RegisterField): boolean {
    const control = this.registerForm.controls[field];

    return control.invalid && (control.touched || this.submitAttempted());
  }

  getFieldError(field: RegisterField): string | null {
    const control = this.registerForm.controls[field];
    const errors = control.errors;

    if (!this.isFieldInvalid(field) || !errors) {
      if (field === 'password_confirmation' && this.hasPasswordMismatch()) {
        return 'La confirmación de contraseña debe coincidir.';
      }

      return null;
    }

    if (errors['server']) {
      return errors['server'];
    }

    if (errors['required']) {
      return field === 'password_confirmation' ? 'Debes confirmar tu contraseña.' : 'Este campo es obligatorio.';
    }

    if (errors['email']) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (errors['maxlength']) {
      return 'Este campo supera la longitud permitida.';
    }

    if (errors['minlength']) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (errors['passwordStrength']) {
      return 'La contraseña no cumple con todos los requisitos.';
    }

    if (field === 'password_confirmation' && this.hasPasswordMismatch()) {
      return 'La confirmación de contraseña debe coincidir.';
    }

    return null;
  }

  hasPasswordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      (this.registerForm.controls.password_confirmation.touched || this.submitAttempted())
    );
  }

  private watchFieldChanges(field: RegisterField): void {
    this.registerForm.controls[field].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearServerError(field);

        if (field === 'password' || field === 'password_confirmation') {
          if (field === 'password') {
            this.passwordValue.set(this.registerForm.controls.password.value);
          }

          this.registerForm.updateValueAndValidity({ emitEvent: false, onlySelf: false });
        }

        if (this.generalError()) {
          this.generalError.set(null);
        }
      });
  }

  private handleRegisterError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const payload = error.error as ValidationErrorResponse;
      const fieldErrors = payload.errors ?? {};

      (Object.entries(fieldErrors) as Array<[string, string[]]>).forEach(([field, messages]) => {
        if (this.isRegisterField(field)) {
          const control = this.registerForm.controls[field];

          control.setErrors({ ...(control.errors ?? {}), server: messages[0] });
          control.markAsTouched();
        }
      });

      const hasMappedErrors = Object.keys(fieldErrors).some((field) => this.isRegisterField(field));

      if (!hasMappedErrors || !payload.errors) {
        this.generalError.set(payload.message || 'Revisa la información del formulario e inténtalo nuevamente.');
      }

      return;
    }

    this.generalError.set('No pudimos crear tu cuenta en este momento. Inténtalo nuevamente.');
  }

  private clearAllServerErrors(): void {
    this.clearServerError('name');
    this.clearServerError('email');
    this.clearServerError('password');
    this.clearServerError('password_confirmation');
  }

  private clearServerError(field: RegisterField): void {
    const control = this.registerForm.controls[field];

    if (!control.errors?.['server']) {
      return;
    }

    const { server, ...rest } = control.errors;
    void server;

    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private isRegisterField(field: string): field is RegisterField {
    return field === 'name' || field === 'email' || field === 'password' || field === 'password_confirmation';
  }
}
