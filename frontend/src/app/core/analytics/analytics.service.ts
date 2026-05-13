import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AnalyticsEvent =
  | 'register-started'
  | 'register-completed'
  | 'cv-uploaded'
  | 'app-generated'
  | 'export-clicked'
  | 'checkout-opened'
  | 'checkout-completed';

type SafeProps = Record<string, string | number | boolean>;

interface PlausibleWindow extends Window {
  plausible?: (event: string, options?: { props?: SafeProps }) => void;
  __LBA_CONFIG__?: { plausibleDomain?: string };
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private scriptInjected = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initPlausible();
    }
  }

  track(event: AnalyticsEvent, props?: SafeProps): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window as PlausibleWindow;
    if (!w.plausible) return;
    w.plausible(event, props ? { props } : undefined);
  }

  private initPlausible(): void {
    if (this.scriptInjected) return;
    const w = window as PlausibleWindow;
    const domain = w.__LBA_CONFIG__?.plausibleDomain;
    if (!domain) return;
    this.scriptInjected = true;
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', domain);
    s.src = 'https://plausible.io/js/plausible.js';
    document.head.appendChild(s);
  }
}
