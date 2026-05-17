import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';

@Component({
  selector: 'lba-confirm-delete-modal',
  imports: [IconsModule],
  templateUrl: './confirm-delete-modal.html',
  styleUrl: './confirm-delete-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModal {
  readonly open = input(false);
  readonly title = input('Wirklich löschen?');
  readonly body = input('Diese Aktion kann nicht rückgängig gemacht werden.');
  readonly confirmLabel = input('Ja, löschen');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.cancelled.emit();
    }
  }
}
