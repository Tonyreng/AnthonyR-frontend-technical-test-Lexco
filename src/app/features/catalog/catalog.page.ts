import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-catalog-page',
  imports: [ButtonModule, RouterLink],
  template: `
    <main class="page-shell">
      <section class="page-card">
        <p class="eyebrow">Catalogo</p>
        <h1>Productos disponibles</h1>
        <p class="muted">Vista de productos conectada a <code>/api/catalog/products</code>.</p>
        <a pButton routerLink="/cart" label="Ver carrito"></a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage {}
