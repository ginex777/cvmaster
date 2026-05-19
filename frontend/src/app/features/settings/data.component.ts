import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { IconsModule } from '../../shared/icons/icons.module';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';

@Component({
  selector: 'lba-settings-data',
  standalone: true,
  imports: [RouterLink, IconsModule, ConfirmDeleteModal],
  templateUrl: './data.component.html',
  styleUrl: './data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly deleteConfirmOpen = signal(false);

  async requestExport(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await this.api.post('/users/me/export', {});
      this.success.set('Du erhältst eine E-Mail mit deinen Daten.');
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Export fehlgeschlagen.');
    } finally {
      this.loading.set(false);
    }
  }

  requestDelete(): void {
    this.deleteConfirmOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirmOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.delete<{ message: string }>('/gdpr/account');
      this.auth.clearSession();
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Konto konnte nicht gelöscht werden.');
    } finally {
      this.loading.set(false);
      this.deleteConfirmOpen.set(false);
    }
  }
}
