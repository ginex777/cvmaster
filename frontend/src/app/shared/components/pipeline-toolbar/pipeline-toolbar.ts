import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { STATUS_META, STATUS_ORDER, type ApplicationStatus } from '../../utils/status.utils';

export interface PipelineFilter {
  query: string;
  minScore: number | null;
  hasReminder: boolean | null;
  dateRange: 'week' | 'month' | null;
  statuses: ApplicationStatus[] | null;
}

@Component({
  selector: 'lba-pipeline-toolbar',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './pipeline-toolbar.html',
  styleUrl: './pipeline-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineToolbar {
  readonly totalCount = input.required<number>();
  readonly filterChange = output<PipelineFilter>();

  readonly query = signal('');
  readonly minScoreActive = signal(false);
  readonly hasReminderActive = signal(false);
  readonly dateRange = signal<'week' | 'month' | null>(null);
  readonly filterPanelOpen = signal(false);
  readonly selectedStatuses = signal<ApplicationStatus[]>([...STATUS_ORDER]);

  protected readonly MIN_SCORE_THRESHOLD = 80;
  protected readonly statusOptions = STATUS_ORDER;
  protected readonly statusMeta = STATUS_META;
  protected readonly allStatusesSelected = computed(() => this.selectedStatuses().length === STATUS_ORDER.length);

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.emitFilter();
  }

  toggleMinScore(): void {
    this.minScoreActive.update(v => !v);
    this.emitFilter();
  }

  toggleReminder(): void {
    this.hasReminderActive.update(v => !v);
    this.emitFilter();
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen.update(open => !open);
  }

  toggleAllStatuses(): void {
    this.selectedStatuses.set([...STATUS_ORDER]);
    this.emitFilter();
  }

  toggleStatus(status: ApplicationStatus): void {
    const current = this.selectedStatuses();
    if (current.includes(status)) {
      const next = current.filter(s => s !== status);
      this.selectedStatuses.set(next.length > 0 ? next : [...STATUS_ORDER]);
    } else {
      this.selectedStatuses.set([...current, status]);
    }
    this.emitFilter();
  }

  setDateRange(range: 'week' | 'month' | null): void {
    this.dateRange.set(range);
    this.emitFilter();
  }

  private emitFilter(): void {
    this.filterChange.emit({
      query: this.query(),
      minScore: this.minScoreActive() ? this.MIN_SCORE_THRESHOLD : null,
      hasReminder: this.hasReminderActive() || null,
      dateRange: this.dateRange(),
      statuses: this.allStatusesSelected() ? null : this.selectedStatuses(),
    });
  }
}
