import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { PipelineBoard } from '../../shared/components/pipeline-board/pipeline-board';
import type { StatusChangeEvent, ReminderChangeEvent } from '../../shared/components/pipeline-board/pipeline-board';
import { PipelineToolbar, type PipelineFilter } from '../../shared/components/pipeline-toolbar/pipeline-toolbar';
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal';
import { IconsModule } from '../../shared/icons/icons.module';

interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  applicationCount: number;
  recentApplications: Application[];
  cvCount: number;
  avgMatchScore: number | null;
  onboardingDismissed: boolean;
}

@Component({
  selector: 'lba-pipeline',
  standalone: true,
  imports: [RouterLink, PipelineBoard, PipelineToolbar, EditorModalComponent, IconsModule],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applications = signal<Application[]>([]);
  readonly totalCount = signal(0);
  readonly selectedAppId = signal<string | null>(null);

  readonly pipelineFilter = signal<PipelineFilter>({ query: '', minScore: null, hasReminder: null, dateRange: null });

  readonly filteredApplications = computed(() => {
    const apps = this.applications();
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

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.api.get<DashboardData>('/users/me/dashboard');
      this.applications.set(data.recentApplications);
      this.totalCount.set(data.applicationCount);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Pipeline konnte nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(filter: PipelineFilter): void {
    this.pipelineFilter.set(filter);
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
