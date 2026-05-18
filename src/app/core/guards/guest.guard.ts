import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { getDefaultRouteForUser } from '../auth/auth-redirect';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.loadCurrentUser().pipe(
    map((user) => (user ? router.createUrlTree([getDefaultRouteForUser(user)]) : true)),
  );
};
