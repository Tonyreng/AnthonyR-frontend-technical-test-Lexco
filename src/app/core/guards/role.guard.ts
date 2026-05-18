import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { Role } from '../models/user';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] ?? []) as Role[];

  return authService.loadCurrentUser().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/auth/login']);
      }

      return allowedRoles.includes(user.role) ? true : router.createUrlTree(['/catalog']);
    }),
  );
};
