import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-before-after',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './before-after.component.html',
  styleUrl: './before-after.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeforeAfterComponent {}
