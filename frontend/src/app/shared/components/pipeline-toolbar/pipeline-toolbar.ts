import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

export interface PipelineFilter {
  query: string;
  minScore: number | null;
  hasReminder: boolean | null;
  dateRange: 'week' | 'month' | null;
}

const DEFAULT_FILTER: PipelineFilter = { query: '', minScore: null, hasReminder: null, dateRange: null };

@Component({
  selector: 'lba-pipeline-toolbar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pipeline-toolbar.html',
  styleUrl: './pipeline-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineToolbar {
  readonly totalCount = input.required<number>();
  readonly filterChange = output<PipelineFilter>();

  readonly queryControl = new FormControl('');
  readonly minScoreActive = signal(false);
  readonly hasReminderActive = signal(false);
  readonly dateRange = signal<'week' | 'month' | null>(null);

  readonly activeFilterCount = computed(() =>
    (this.minScoreActive() ? 1 : 0) +
    (this.hasReminderActive() ? 1 : 0) +
    (this.dateRange() !== null ? 1 : 0)
  );

  onQueryInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.emit(query);
  }

  toggleMinScore(): void {
    this.minScoreActive.update(v => !v);
    this.emit(this.queryControl.value ?? '');
  }

  toggleReminder(): void {
    this.hasReminderActive.update(v => !v);
    this.emit(this.queryControl.value ?? '');
  }

  setDateRange(range: 'week' | 'month' | null): void {
    this.dateRange.set(range);
    this.emit(this.queryControl.value ?? '');
  }

  private emit(query: string): void {
    this.filterChange.emit({
      query,
      minScore: this.minScoreActive() ? 70 : null,
      hasReminder: this.hasReminderActive() ? true : null,
      dateRange: this.dateRange(),
    });
  }
}
