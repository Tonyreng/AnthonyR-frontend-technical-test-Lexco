import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-management.page').then((m) => m.UserManagementPage),
  },
  {
    path: 'products',
    loadComponent: () => import('./products/product-management.page').then((m) => m.ProductManagementPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/admin-profile.page').then((m) => m.AdminProfilePage),
  },
];
