import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IconsModule } from '../icons/icons.module';

@Component({
  selector: 'lba-keyword-bar',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './keyword-bar.component.html',
  styleUrl: './keyword-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeywordBarComponent {
  matched = input<string[]>([]);
  missing = input<string[]>([]);
  readonly addKeyword = output<void>();
}
