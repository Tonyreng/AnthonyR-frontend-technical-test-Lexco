import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cart-page',
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Carrito</p>
        <h1>Carrito de compras</h1>
        <p class="muted">Estado reactivo para contador, total y compra con <code>/api/purchases</code>.</p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {}
