import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IconsModule } from '../../../shared/icons/icons.module';

@Component({
  selector: 'lba-hero',
  standalone: true,
  imports: [RevealDirective, IconsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  readonly optimizeRequested = output<void>();
}
