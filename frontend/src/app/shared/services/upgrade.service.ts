import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UpgradeService {
  readonly requested = signal(false);

  request(): void {
    this.requested.set(true);
  }

  clear(): void {
    this.requested.set(false);
  }
}
