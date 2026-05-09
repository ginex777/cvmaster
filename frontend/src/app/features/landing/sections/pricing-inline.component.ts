import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-pricing-inline',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './pricing-inline.component.html',
  styleUrl: './pricing-inline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingInlineComponent {
  readonly singleRequested = output<void>();
  readonly proRequested = output<void>();
}
