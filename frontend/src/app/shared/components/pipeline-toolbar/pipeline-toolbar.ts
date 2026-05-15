import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

export interface PipelineFilter {
  query: string;
  minScore: number | null;
  hasReminder: boolean | null;
  dateRange: 'week' | 'month' | null;
}

@Component({
  selector: 'lba-pipeline-toolbar',
  standalone: true,
  imports: [],
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

  protected readonly MIN_SCORE_THRESHOLD = 70;

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
    });
  }
}
