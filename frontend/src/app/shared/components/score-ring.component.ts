import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'lba-score-ring',
  standalone: true,
  imports: [],
  templateUrl: './score-ring.component.html',
  styleUrl: './score-ring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreRingComponent {
  value = input.required<number>();
  size = input(64);

  ariaLabel  = computed(() => `Match-Score: ${this.value()}%`);
  dashArray  = computed(() => {
    const fill = (this.value() / 100) * 100;
    return `${fill} ${100 - fill}`;
  });
  strokeWidth = computed(() => this.size() >= 50 ? 4 : 3);
  fontSize    = computed(() => this.size() >= 50 ? 14 : 12);
  strokeColor = computed(() => {
    if (this.value() >= 80) return 'var(--status-offer)';
    if (this.value() >= 60) return 'var(--status-applied)';
    return 'var(--warn)';
  });
}
