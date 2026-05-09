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

  ariaLabel  = computed(() => `Match-Score: ${this.value()}%`);
  dashArray  = computed(() => {
    const fill = (this.value() / 100) * 100;
    return `${fill} ${100 - fill}`;
  });
  strokeColor = computed(() => {
    if (this.value() >= 80) return 'var(--success)';
    if (this.value() >= 60) return 'var(--warning)';
    return 'var(--danger)';
  });
}
