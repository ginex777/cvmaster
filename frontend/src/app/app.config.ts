import type { ApplicationConfig} from '@angular/core';
import { provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

function sessionHydration() {
  const auth = inject(AuthService);
  return () => auth.refresh().catch(() => {
    // No valid session cookie — user stays logged out, no action needed
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withViewTransitions()
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: APP_INITIALIZER, useFactory: sessionHydration, multi: true },
  ],
};
