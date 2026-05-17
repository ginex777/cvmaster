import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardPadding = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lba-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly title = input<string | undefined>(undefined);

  readonly paddingPx = computed((): string => {
    const map: Record<CardPadding, string> = { sm: '14px', md: '20px', lg: '28px' };
    return map[this.padding()];
  });
}
