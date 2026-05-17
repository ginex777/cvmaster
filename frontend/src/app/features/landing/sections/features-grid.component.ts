import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IconsModule } from '../../../shared/icons/icons.module';

@Component({
  selector: 'lba-features-grid',
  standalone: true,
  imports: [RevealDirective, IconsModule],
  templateUrl: './features-grid.component.html',
  styleUrl: './features-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesGridComponent {}
