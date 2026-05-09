import { Injectable, signal, effect } from '@angular/core';

export interface Consent {
  necessary: true;       // immer true (TTDSG § 25 Abs. 2 Nr. 2)
  support: boolean;      // Crisp Chat
  version: string;
}

const KEY = 'consent_v1';
const CURRENT_VERSION = '2025-01';

@Injectable({ providedIn: 'root' })
export class ConsentService {
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
    localStorage.removeItem(KEY);
    this.consent.set(null);
    this.needsBanner.set(true);
    location.reload();
  }

  private save(c: Consent) {
    localStorage.setItem(KEY, JSON.stringify(c));
    this.consent.set(c);
    this.needsBanner.set(false);
  }

  private load(): Consent | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private loadCrisp() {
    const w = window as Window & { $crisp?: unknown[]; CRISP_WEBSITE_ID?: string; __CRISP_ID?: string };
    if (w.$crisp) return;
    w.$crisp = [];
    w.CRISP_WEBSITE_ID = w.__CRISP_ID;
    const s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.head.appendChild(s);
  }
}
