import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-pricing-inline',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './pricing-inline.component.html',
  styleUrl: './pricing-inline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingInlineComponent {}
