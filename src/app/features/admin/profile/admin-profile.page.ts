import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-profile-page',
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Admin</p>
        <h1>Profile</h1>
        <p class="muted">Vista y edicion del administrador autenticado.</p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfilePage {}
