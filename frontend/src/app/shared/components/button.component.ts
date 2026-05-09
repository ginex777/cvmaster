import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
export type ButtonSize    = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lba-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  variant  = input<ButtonVariant>('primary');
  size     = input<ButtonSize>('md');
  disabled = input(false);
  type     = input<'button' | 'submit' | 'reset'>('button');
}
