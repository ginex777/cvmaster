import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { PipelineBoard } from '../../shared/components/pipeline-board/pipeline-board';
import type { StatusChangeEvent, ReminderChangeEvent } from '../../shared/components/pipeline-board/pipeline-board';
import { PipelineToolbar, type PipelineFilter } from '../../shared/components/pipeline-toolbar/pipeline-toolbar';
import { IconsModule } from '../../shared/icons/icons.module';
import { legacyToStatus, type ApplicationStatus } from '../../shared/utils/status.utils';
import type { Application } from '../../shared/models/dashboard.model';

@Component({
  selector: 'lba-pipeline',
  standalone: true,
  imports: [RouterLink, PipelineBoard, PipelineToolbar, IconsModule],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applications = signal<Application[]>([]);

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
      this.applications.set(await this.api.get<Application[]>('/applications'));
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

  openApplication(id: string): void {
    void this.router.navigate(['/app/applications', id]);
  }

  openWizardForStatus(status: string): void {
    void this.router.navigate(['/app/wizard'], { queryParams: { status } });
  }

  private toApplicationStatus(status: string): ApplicationStatus {
    return legacyToStatus(status, true);
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
