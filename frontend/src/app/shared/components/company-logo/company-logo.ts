import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PALETTE = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

@Component({
  selector: 'lba-company-logo',
  standalone: true,
  imports: [],
  templateUrl: './company-logo.html',
  styleUrl: './company-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyLogoComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(32);
  readonly imageUrl = input<string | null>(null);

  readonly initials = computed(() =>
    this.name().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  );

  readonly color = computed(() => PALETTE[this.name().length % PALETTE.length]);

  readonly bgColor = computed(() => `${this.color()}22`);

  readonly fontSize = computed(() => Math.round(this.size() * 0.38));
}
