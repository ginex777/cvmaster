import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'lba-keyword-bar',
  standalone: true,
  imports: [],
  templateUrl: './keyword-bar.component.html',
  styleUrl: './keyword-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeywordBarComponent {
  matched = input<string[]>([]);
  missing = input<string[]>([]);
}
