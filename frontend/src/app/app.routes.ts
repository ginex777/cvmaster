import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Marketing (SSR)
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'preise', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'try', loadComponent: () => import('./features/try/try.component').then(m => m.TryComponent) },

  // Auth
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },

  // App (geschützt)
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'cvs', loadComponent: () => import('./features/master-cvs/master-cvs.component').then(m => m.MasterCvsComponent) },
      { path: 'applications/:id', loadComponent: () => import('./features/application-editor/editor.component').then(m => m.EditorComponent) },
    ],
  },

  // Legal
  { path: 'datenschutz', loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'agb', loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent) },
  { path: 'impressum', loadComponent: () => import('./features/legal/imprint.component').then(m => m.ImprintComponent) },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
