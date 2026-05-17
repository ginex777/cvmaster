import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { IconsModule } from '../../shared/icons/icons.module';

@Component({
  selector: 'lba-settings-data',
  standalone: true,
  imports: [RouterLink, IconsModule],
  templateUrl: './data.component.html',
  styleUrl: './data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  async requestExport(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await this.api.post('/users/me/export', {});
      this.success.set('Dein Datenexport wird vorbereitet und per E-Mail zugeschickt.');
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Export fehlgeschlagen.');
    } finally {
      this.loading.set(false);
    }
  }
}
