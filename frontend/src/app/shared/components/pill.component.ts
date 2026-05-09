import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type PillColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'lba-pill',
  standalone: true,
  imports: [],
  templateUrl: './pill.component.html',
  styleUrl: './pill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillComponent {
  color = input<PillColor>('default');
}
