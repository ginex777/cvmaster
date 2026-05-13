import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lba-billing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  async exportData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    try {
      const blob = await this.api.getBlob('/gdpr/export');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'meine-daten.json';
      anchor.click();
      URL.revokeObjectURL(url);
      this.message.set('Datenexport wurde vorbereitet.');
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Datenexport konnte nicht erstellt werden.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    const confirmed = typeof window === 'undefined'
      ? false
      : window.confirm('Konto und alle Daten dauerhaft loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.');

    if (!confirmed) return;

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    try {
      await this.api.delete<{ message: string }>('/gdpr/account');
      this.auth.clearSession();
      this.message.set('Konto und alle Daten wurden geloescht.');
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Konto konnte nicht geloescht werden.');
    } finally {
      this.loading.set(false);
    }
  }

  planLabel(plan: string | undefined): string {
    const labels: Record<string, string> = {
      FREE: 'Free',
      PAY_PER_APP: 'Pay-per-App',
      PRO: 'Pro',
      free: 'Free',
      pay: 'Pay-per-App',
      pro: 'Pro',
    };
    return labels[plan ?? ''] ?? 'Free';
  }
}
