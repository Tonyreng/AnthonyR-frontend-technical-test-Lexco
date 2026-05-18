import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-management-page',
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Admin</p>
        <h1>User Management</h1>
        <p class="muted">CRUD de usuarios conectado a <code>/api/users</code>.</p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementPage {}
