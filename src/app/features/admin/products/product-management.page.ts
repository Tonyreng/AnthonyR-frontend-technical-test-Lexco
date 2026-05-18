import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-product-management-page',
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Admin</p>
        <h1>Product Management</h1>
        <p class="muted">CRUD de productos conectado a <code>/api/products</code>.</p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagementPage {}
