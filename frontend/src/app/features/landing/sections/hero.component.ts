import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IconsModule } from '../../../shared/icons/icons.module';

@Component({
  selector: 'lba-hero',
  standalone: true,
  imports: [RouterLink, RevealDirective, IconsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {}
