import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-register-page',
  imports: [ButtonModule, RouterLink],
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Autenticacion</p>
        <h1>Register</h1>
        <p class="muted">El backend asigna rol admin al primer usuario y user a los siguientes.</p>
        <a pButton routerLink="/auth/login" label="Ya tengo cuenta"></a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {}
