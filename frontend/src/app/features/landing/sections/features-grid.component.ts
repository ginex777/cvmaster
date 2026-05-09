import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-features-grid',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './features-grid.component.html',
  styleUrl: './features-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesGridComponent {}
