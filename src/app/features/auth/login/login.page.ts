import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login-page',
  imports: [ButtonModule, RouterLink],
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Autenticacion</p>
        <h1>Login</h1>
        <p class="muted">Formulario reactivo pendiente de implementar contra <code>/api/auth/login</code>.</p>
        <a pButton routerLink="/auth/register" label="Crear cuenta"></a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {}
