import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { type CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { scoreClass } from '../../utils/score.utils';
import { HighlightPipe } from '../../pipes/highlight.pipe';
import { legacyToStatus, STATUS_META, STATUS_ORDER, type ApplicationStatus } from '../../utils/status.utils';
import { IconsModule } from '../../icons/icons.module';
import { CompanyLogoComponent } from '../company-logo/company-logo';

export interface PipelineApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

export interface StatusChangeEvent {
  id: string;
  status: string;
}

export interface ReminderChangeEvent {
  id: string;
  reminderAt: string | null;
}

interface PipelineColumn {
  key: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  accent: string;
}

@Component({
  selector: 'lba-pipeline-board',
  standalone: true,
  imports: [DatePipe, HighlightPipe, IconsModule, CompanyLogoComponent, DragDropModule],
  templateUrl: './pipeline-board.html',
  styleUrl: './pipeline-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineBoard {
  readonly applications = input.required<PipelineApplication[]>();
  readonly highlightQuery = input<string>('');

  readonly statusChange = output<StatusChangeEvent>();
  readonly reminderChange = output<ReminderChangeEvent>();
  readonly applicationOpen = output<string>();

  readonly columns = computed<PipelineColumn[]>(() =>
    STATUS_ORDER.map(key => {
      const meta = STATUS_META[key];
      return {
        key,
        label: meta.label,
        color: meta.color,
        bg: meta.bg,
        accent: meta.color,
      };
    }),
  );
  readonly connectedDropListIds = computed(() => this.columns().map(col => this.dropListId(col.key)));

  readonly dimmedColumnKeys = computed(() => {
    const apps = this.applications();
    return new Set(
      this.columns()
        .filter(col => apps.filter(a => legacyToStatus(a.status) === col.key).length === 0)
        .map(col => col.key)
    );
  });

  appsForColumn(column: PipelineColumn): PipelineApplication[] {
    return this.applications().filter(app => legacyToStatus(app.status) === column.key);
  }

  moveToColumn(app: PipelineApplication, column: PipelineColumn): void {
    const targetStatus = column.key;
    if (legacyToStatus(app.status) !== targetStatus) {
      this.statusChange.emit({ id: app.id, status: targetStatus });
    }
  }

  onCardDropped(
    event: CdkDragDrop<PipelineApplication[], PipelineApplication[], PipelineApplication>,
    column: PipelineColumn,
  ): void {
    this.moveToColumn(event.item.data, column);
  }

  dropListId(status: ApplicationStatus): string {
    return `pipeline-${status.toLowerCase()}`;
  }

  onReminderInput(app: PipelineApplication, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.reminderChange.emit({ id: app.id, reminderAt: value || null });
  }

  jobTitle(app: PipelineApplication): string {
    return app.jobPosting.parsedJson.title ?? 'Position offen';
  }

  company(app: PipelineApplication): string {
    return app.jobPosting.parsedJson.company ?? '';
  }

  readonly scoreClass = scoreClass;

  reminderDateValue(app: PipelineApplication): string {
    if (!app.reminderAt) return '';
    return app.reminderAt.slice(0, 10);
  }

  hasReminder(app: PipelineApplication): boolean {
    return !!app.reminderAt;
  }
}
