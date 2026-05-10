import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

@Component({
  selector: 'lba-confirm-delete-modal',
  templateUrl: './confirm-delete-modal.html',
  styleUrl: './confirm-delete-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModal {
  readonly open = input(false);
  readonly title = input('Wirklich loschen?');
  readonly body = input('Diese Aktion kann nicht ruckgangig gemacht werden.');
  readonly confirmLabel = input('Ja, loschen');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.cancelled.emit();
    }
  }
}
