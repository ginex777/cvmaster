import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
  // Marketing
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'preise', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'try', loadComponent: () => import('./features/try/try.component').then(m => m.TryComponent) },

  // Auth
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },

  // App (authenticated)
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AppShellComponent,
        children: [
          { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'cvs', loadComponent: () => import('./features/master-cvs/master-cvs.component').then(m => m.MasterCvsComponent) },
          { path: 'billing', loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent) },
          { path: 'wizard', loadComponent: () => import('./features/wizard/wizard.component').then(m => m.WizardComponent) },
          { path: 'security', loadComponent: () => import('./features/security/security.component').then(m => m.SecurityComponent) },
        ],
      },
      // Editor: full-screen, no shell
      { path: 'applications/:id', loadComponent: () => import('./features/application-editor/editor.component').then(m => m.EditorComponent) },
    ],
  },

  // FAQ
  { path: 'faq', loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent) },

  // Legal
  { path: 'datenschutz', loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'agb', loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent) },
  { path: 'impressum', loadComponent: () => import('./features/legal/imprint.component').then(m => m.ImprintComponent) },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
