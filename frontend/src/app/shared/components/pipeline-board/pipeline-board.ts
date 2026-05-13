import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  key: string;
  label: string;
  statuses: string[];
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: 'open',      label: 'Offen',     statuses: ['OPEN', 'DONE', 'DRAFT', 'EXPORTED'] },
  { key: 'sent',      label: 'Gesendet',  statuses: ['SENT'] },
  { key: 'replied',   label: 'Antwort',   statuses: ['REPLIED'] },
  { key: 'interview', label: 'Interview', statuses: ['INTERVIEW'] },
  { key: 'offer',     label: 'Angebot',   statuses: ['OFFER'] },
  { key: 'rejected',  label: 'Absage',    statuses: ['REJECTED', 'FAILED'] },
];

@Component({
  selector: 'lba-pipeline-board',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './pipeline-board.html',
  styleUrl: './pipeline-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineBoard {
  readonly applications = input.required<PipelineApplication[]>();

  readonly statusChange = output<StatusChangeEvent>();
  readonly reminderChange = output<ReminderChangeEvent>();

  readonly columns = PIPELINE_COLUMNS;

  appsForColumn(column: PipelineColumn): PipelineApplication[] {
    return this.applications().filter(app => column.statuses.includes(app.status));
  }

  moveToColumn(app: PipelineApplication, column: PipelineColumn): void {
    const targetStatus = column.statuses[0];
    if (app.status !== targetStatus) {
      this.statusChange.emit({ id: app.id, status: targetStatus });
    }
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

  scoreClass(score: number): string {
    if (score >= 80) return 'score--high';
    if (score >= 60) return 'score--mid';
    return 'score--low';
  }

  reminderDateValue(app: PipelineApplication): string {
    if (!app.reminderAt) return '';
    return app.reminderAt.slice(0, 10);
  }

  hasReminder(app: PipelineApplication): boolean {
    return !!app.reminderAt;
  }
}
