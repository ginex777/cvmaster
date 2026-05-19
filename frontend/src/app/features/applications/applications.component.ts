import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill';
import { CompanyLogoComponent } from '../../shared/components/company-logo/company-logo';
import { IconsModule } from '../../shared/icons/icons.module';
import { legacyToStatus, type ApplicationStatus } from '../../shared/utils/status.utils';
import type { Application } from '../../shared/models/dashboard.model';

@Component({
  selector: 'lba-applications',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDeleteModal, StatusPillComponent, CompanyLogoComponent, IconsModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applications = signal<Application[]>([]);

  readonly deletingId = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly filteredApplications = computed(() => {
    const apps = this.applications();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(app => {
      const title   = (app.jobPosting?.parsedJson?.title   ?? '').toLowerCase();
      const company = (app.jobPosting?.parsedJson?.company ?? '').toLowerCase();
      return title.includes(q) || company.includes(q);
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.applications.set(await this.api.get<Application[]>('/applications'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Bewerbungen konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  toApplicationStatus(status: string): ApplicationStatus {
    return legacyToStatus(status, true);
  }

  jobTitle(app: Application): string {
    return app.jobPosting.parsedJson.title ?? 'Position offen';
  }

  companyName(app: Application): string {
    return app.jobPosting.parsedJson.company ?? 'Unbekannt';
  }

  openApplication(id: string): void {
    void this.router.navigate(['/app/applications', id]);
  }

  onListSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  requestDelete(id: string): void {
    this.deletingId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;
    this.error.set(null);
    try {
      await this.api.delete(`/applications/${id}`);
      this.applications.update(list => list.filter(a => a.id !== id));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.');
    } finally {
      this.deletingId.set(null);
    }
  }

}
