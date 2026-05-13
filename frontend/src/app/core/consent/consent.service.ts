import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';

export interface Consent {
  necessary: true;       // immer true (TTDSG § 25 Abs. 2 Nr. 2)
  support: boolean;      // Crisp Chat
  version: string;
}

const KEY = 'consent_v1';
const CURRENT_VERSION = '2025-01';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  consent = signal<Consent | null>(this.load());
  needsBanner = signal(false);

  constructor() {
    if (!this.consent() || this.consent()?.version !== CURRENT_VERSION) {
      this.needsBanner.set(true);
    }

    // Crisp lazy-laden, sobald Consent erteilt
    effect(() => {
      const c = this.consent();
      if (c?.support) this.loadCrisp();
    });
  }

  acceptAll() {
    this.save({ necessary: true, support: true, version: CURRENT_VERSION });
  }

  acceptNecessary() {
    this.save({ necessary: true, support: false, version: CURRENT_VERSION });
  }

  revoke() {
    if (this.isBrowser()) {
      localStorage.removeItem(KEY);
    }
    this.consent.set(null);
    this.needsBanner.set(true);
  }

  openSettings() {
    this.needsBanner.set(true);
  }

  private save(c: Consent) {
    if (!this.isBrowser()) return;
    localStorage.setItem(KEY, JSON.stringify(c));
    this.consent.set(c);
    this.needsBanner.set(false);
  }

  private load(): Consent | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private loadCrisp() {
    if (!this.isBrowser()) return;

    const w = window as Window & {
      $crisp?: unknown[];
      CRISP_WEBSITE_ID?: string;
      __CRISP_ID?: string;
      __LBA_CONFIG__?: { crispWebsiteId?: string };
    };
    if (w.$crisp) return;
    const websiteId = w.__CRISP_ID ?? w.__LBA_CONFIG__?.crispWebsiteId;
    if (!websiteId) return;

    w.$crisp = [];
    w.CRISP_WEBSITE_ID = websiteId;
    const s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.head.appendChild(s);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
