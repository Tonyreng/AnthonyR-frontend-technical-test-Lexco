import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [ButtonModule, RouterLink],
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Admin</p>
        <h1>Dashboard</h1>
        <p class="muted">Panel para alternar gestion de usuarios y productos.</p>
        <a pButton routerLink="/admin/users" label="Gestionar usuarios"></a>
        <a pButton routerLink="/admin/products" label="Gestionar productos" severity="secondary"></a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {}
