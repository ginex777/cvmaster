import type { CanActivateFn} from '@angular/router';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const planGuard = (required: 'pro' | 'pay' | 'free'): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user()?.plan === required ? true : router.createUrlTree(['/preise']);
};
