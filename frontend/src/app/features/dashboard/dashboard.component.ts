import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { PipelineBoard } from '../../shared/components/pipeline-board/pipeline-board';
import type { StatusChangeEvent, ReminderChangeEvent } from '../../shared/components/pipeline-board/pipeline-board';
import { PipelineToolbar, type PipelineFilter } from '../../shared/components/pipeline-toolbar/pipeline-toolbar';
import { scoreClass } from '../../shared/utils/score.utils';
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal';

interface RecentApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  onboardingDismissed: boolean;
  cvCount: number;
  applicationCount: number;
  avgMatchScore: number | null;
  recentApplications: RecentApplication[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDeleteModal, PipelineBoard, PipelineToolbar, EditorModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly dismissingOnboarding = signal(false);
  readonly selectedAppId = signal<string | null>(null);

  readonly onboardingSteps = computed(() => {
    const d = this.data();
    if (!d) return null;
    const exported = d.recentApplications.some(a =>
      ['EXPORTED', 'SENT', 'REPLIED', 'INTERVIEW', 'OFFER'].includes(a.status),
    );
    return { cvUploaded: d.cvCount > 0, applicationCreated: d.applicationCount > 0, exported };
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.get<DashboardData>('/users/me/dashboard'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Daten konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  readonly scoreClass = scoreClass;

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Wird optimiert…',
      OPEN: 'Offen',
      DONE: 'Erledigt',
      EXPORTED: 'Exportiert',
      SENT: 'Gesendet',
      REPLIED: 'Antwort',
      INTERVIEW: 'Interview',
      REJECTED: 'Abgelehnt',
      OFFER: 'Angebot',
    };
    return labels[status] ?? status;
  }

  async toggleStatus(id: string): Promise<void> {
    const dashboard = this.data();
    const app = dashboard?.recentApplications.find(item => item.id === id);
    if (!dashboard || !app) return;

    const previous = app.status;
    const status = previous === 'DONE' ? 'OPEN' : 'DONE';
    this.updateApplicationInList(id, { status });
    this.error.set(null);

    try {
      await this.api.patch(`/applications/${id}/status`, { status });
    } catch (e: unknown) {
      this.updateApplicationInList(id, { status: previous });
      this.error.set(this.errorMessage(e, 'Status konnte nicht geändert werden.'));
    }
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
      this.data.update(current => current ? {
        ...current,
        applicationCount: Math.max(0, current.applicationCount - 1),
        recentApplications: current.recentApplications.filter(app => app.id !== id),
      } : current);
    } catch (e: unknown) {
      this.error.set(this.errorMessage(e, 'Löschen fehlgeschlagen. Bitte erneut versuchen.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  async dismissOnboarding(): Promise<void> {
    this.dismissingOnboarding.set(true);
    try {
      await this.api.post('/users/me/dismiss-onboarding', {});
      this.data.update(d => d ? { ...d, onboardingDismissed: true } : d);
    } catch {
      // silently fail — checklist stays visible if the request fails
    } finally {
      this.dismissingOnboarding.set(false);
    }
  }

  readonly showPipeline = signal(false);

  readonly pipelineFilter = signal<PipelineFilter>({ query: '', minScore: null, hasReminder: null, dateRange: null });

  readonly filteredApplications = computed(() => {
    const apps = this.data()?.recentApplications ?? [];
    const { query, minScore, hasReminder, dateRange } = this.pipelineFilter();
    const q = query.trim().toLowerCase();

    return apps.filter(app => {
      if (minScore !== null && (app.matchScore ?? 0) < minScore) return false;
      if (hasReminder === true && !app.reminderAt) return false;
      if (q) {
        const title   = (app.jobPosting?.parsedJson?.title   ?? '').toLowerCase();
        const company = (app.jobPosting?.parsedJson?.company ?? '').toLowerCase();
        if (!title.includes(q) && !company.includes(q)) return false;
      }
      if (dateRange) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (dateRange === 'week' ? 7 : 30));
        if (new Date(app.createdAt) < cutoff) return false;
      }
      return true;
    });
  });

  onFilterChange(filter: PipelineFilter): void {
    this.pipelineFilter.set(filter);
  }

  toggleView(): void {
    this.showPipeline.update(v => !v);
  }

  async onStatusChange(event: StatusChangeEvent): Promise<void> {
    const previous = this.data()?.recentApplications.find(a => a.id === event.id)?.status;
    this.updateApplicationInList(event.id, { status: event.status });
    try {
      await this.api.patch(`/applications/${event.id}/status`, { status: event.status });
    } catch (e: unknown) {
      if (previous) this.updateApplicationInList(event.id, { status: previous });
      this.error.set(this.errorMessage(e, 'Status konnte nicht geändert werden.'));
    }
  }

  async onReminderChange(event: ReminderChangeEvent): Promise<void> {
    const previous = this.data()?.recentApplications.find(a => a.id === event.id)?.reminderAt;
    const reminderAt = event.reminderAt ? new Date(event.reminderAt).toISOString() : null;
    this.updateApplicationInList(event.id, { reminderAt });
    try {
      await this.api.patch(`/applications/${event.id}/reminder`, { reminderAt });
    } catch (e: unknown) {
      this.updateApplicationInList(event.id, { reminderAt: previous ?? null });
      this.error.set(this.errorMessage(e, 'Erinnerung konnte nicht gespeichert werden.'));
    }
  }

  companyName(app: RecentApplication): string {
    return app.jobPosting.parsedJson.company ?? 'Unbekannt';
  }

  jobTitle(app: RecentApplication): string {
    return app.jobPosting.parsedJson.title ?? 'Position offen';
  }

  private updateApplicationInList(id: string, patch: Partial<RecentApplication>): void {
    this.data.update(current => current ? {
      ...current,
      recentApplications: current.recentApplications.map(app => app.id === id ? { ...app, ...patch } : app),
    } : current);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && this.hasMessage(error.error)) {
      return error.error.message;
    }
    return fallback;
  }

  private hasMessage(value: unknown): value is { message: string } {
    return typeof value === 'object' && value !== null && typeof (value as { message?: unknown }).message === 'string';
  }
}
