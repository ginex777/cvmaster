import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lba-logo-bar',
  standalone: true,
  templateUrl: './logo-bar.component.html',
  styleUrl: './logo-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoBarComponent {}
