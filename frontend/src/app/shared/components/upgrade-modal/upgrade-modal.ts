import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';

@Component({
  selector: 'lba-upgrade-modal',
  imports: [IconsModule],
  templateUrl: './upgrade-modal.html',
  styleUrl: './upgrade-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeModal {
  readonly open = input(false);
  readonly upgradeRequested = output<void>();
  readonly dismissed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.dismissed.emit();
    }
  }
}
