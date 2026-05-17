import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type ApplicationStatus, STATUS_META } from '../../utils/status.utils';

@Component({
  selector: 'lba-status-pill',
  standalone: true,
  imports: [],
  templateUrl: './status-pill.html',
  styleUrl: './status-pill.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPillComponent {
  readonly status = input.required<ApplicationStatus>();
  readonly size = input<'sm' | 'md'>('sm');
  readonly meta = computed(() => STATUS_META[this.status()]);
}
