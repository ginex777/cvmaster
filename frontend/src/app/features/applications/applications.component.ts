import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { PipelineBoard } from '../../shared/components/pipeline-board/pipeline-board';
import type { StatusChangeEvent, ReminderChangeEvent } from '../../shared/components/pipeline-board/pipeline-board';
import { PipelineToolbar, type PipelineFilter } from '../../shared/components/pipeline-toolbar/pipeline-toolbar';
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill';
import { CompanyLogoComponent } from '../../shared/components/company-logo/company-logo';
import { IconsModule } from '../../shared/icons/icons.module';
import { legacyToStatus, type ApplicationStatus } from '../../shared/utils/status.utils';
import type { Application, DashboardData } from '../../shared/models/dashboard.model';

@Component({
  selector: 'lba-applications',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDeleteModal, PipelineBoard, PipelineToolbar, EditorModalComponent, StatusPillComponent, CompanyLogoComponent, IconsModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applications = signal<Application[]>([]);

  readonly deletingId = signal<string | null>(null);
  readonly selectedAppId = signal<string | null>(null);
  readonly showPipeline = signal(false);
  readonly pipelineFilter = signal<PipelineFilter>({ query: '', minScore: null, hasReminder: null, dateRange: null, statuses: null });

  readonly filteredApplications = computed(() => {
    const apps = this.applications();
    const { query, minScore, hasReminder, dateRange, statuses } = this.pipelineFilter();
    const q = query.trim().toLowerCase();

    return apps.filter(app => {
      if (minScore !== null && (app.matchScore ?? 0) < minScore) return false;
      if (hasReminder === true && !app.reminderAt) return false;
      if (statuses && !statuses.includes(this.toApplicationStatus(app.status))) return false;
      if (q) {
        const title   = (app.jobPosting?.parsedJson?.title   ?? '').toLowerCase();
        const company = (app.jobPosting?.parsedJson?.company ?? '').toLowerCase();
        const score = app.matchScore !== null ? String(app.matchScore) : '';
        if (!title.includes(q) && !company.includes(q) && !score.includes(q)) return false;
      }
      if (dateRange) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (dateRange === 'week' ? 7 : 30));
        if (new Date(app.createdAt) < cutoff) return false;
      }
      return true;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.api.get<DashboardData>('/users/me/dashboard');
      this.applications.set(data.recentApplications);
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

  toggleView(): void {
    this.showPipeline.update(v => !v);
  }

  onFilterChange(filter: PipelineFilter): void {
    this.pipelineFilter.set(filter);
  }

  onListSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.pipelineFilter.update(filter => ({ ...filter, query }));
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

  async onStatusChange(event: StatusChangeEvent): Promise<void> {
    const previous = this.applications().find(a => a.id === event.id)?.status;
    this.applications.update(list => list.map(a => a.id === event.id ? { ...a, status: event.status } : a));
    try {
      await this.api.patch(`/applications/${event.id}/status`, { status: event.status });
    } catch (e: unknown) {
      if (previous) this.applications.update(list => list.map(a => a.id === event.id ? { ...a, status: previous } : a));
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Status konnte nicht geändert werden.');
    }
  }

  async onReminderChange(event: ReminderChangeEvent): Promise<void> {
    const previous = this.applications().find(a => a.id === event.id)?.reminderAt;
    const reminderAt = event.reminderAt ? new Date(event.reminderAt).toISOString() : null;
    this.applications.update(list => list.map(a => a.id === event.id ? { ...a, reminderAt } : a));
    try {
      await this.api.patch(`/applications/${event.id}/reminder`, { reminderAt });
    } catch (e: unknown) {
      this.applications.update(list => list.map(a => a.id === event.id ? { ...a, reminderAt: previous ?? null } : a));
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Erinnerung konnte nicht gespeichert werden.');
    }
  }
}
