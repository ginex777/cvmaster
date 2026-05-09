import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-cta-band',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './cta-band.component.html',
  styleUrl: './cta-band.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaBandComponent {
  readonly optimizeRequested = output<void>();
  readonly demoRequested = output<void>();
}
