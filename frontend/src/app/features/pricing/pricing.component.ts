import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lba-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {}
