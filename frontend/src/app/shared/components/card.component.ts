import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lba-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
