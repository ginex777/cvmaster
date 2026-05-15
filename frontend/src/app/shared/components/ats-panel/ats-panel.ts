import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ScoreRingComponent } from '../score-ring.component';

export interface AtsMatchReport {
  summary?: string;
  keywords?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  risks?: string[];
}

export interface OptimizationDiffEntry {
  section: string;
  before: string;
  after: string;
  reason: string;
}

@Component({
  selector: 'lba-ats-panel',
  standalone: true,
  imports: [ScoreRingComponent],
  templateUrl: './ats-panel.html',
  styleUrl: './ats-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtsPanel {
  readonly score = input.required<number | null>();
  readonly matchReport = input.required<AtsMatchReport | null>();
  readonly optimizationDiff = input.required<OptimizationDiffEntry[] | null>();

  readonly hasData = computed(() => this.score() !== null && this.score() !== undefined);
  readonly scoreValue = computed(() => this.score() ?? 0);
  readonly matchedKeywords = computed(() => this.matchReport()?.matchedKeywords ?? this.matchReport()?.keywords ?? []);
  readonly missingRequired = computed(() => this.matchReport()?.risks ?? []);
  readonly missingOptional = computed(() => {
    const required = new Set(this.missingRequired());
    return (this.matchReport()?.missingKeywords ?? []).filter(keyword => !required.has(keyword));
  });
  readonly diffEntries = computed(() => this.optimizationDiff() ?? []);
  readonly scoreLabel = computed(() => {
    const score = this.score();
    if (score === null || score === undefined) return 'Nicht verfuegbar';
    if (score >= 80) return 'Sehr gut';
    if (score >= 60) return 'Gut';
    return 'Verbesserungswuerdig';
  });
  readonly scoreAriaLabel = computed(() => `ATS Score ${this.scoreValue()} Prozent - ${this.scoreLabel()}`);
}
