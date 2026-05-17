import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconsModule } from '../icons/icons.module';

export type PillColor = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'pro';

@Component({
  selector: 'lba-pill',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './pill.component.html',
  styleUrl: './pill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillComponent {
  color    = input<PillColor>('neutral');
  showLock = input(false);
}
