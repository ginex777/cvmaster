import { ChangeDetectionStrategy, Component, HostListener, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IconsModule } from '../../icons/icons.module';

@Component({
  selector: 'lba-einstellungen-modal',
  standalone: true,
  imports: [RouterLink, IconsModule],
  templateUrl: './einstellungen-modal.component.html',
  styleUrl: './einstellungen-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EinstellungenModalComponent {
  readonly open = input(false);
  readonly closeModal = output<void>();

  protected readonly auth = inject(AuthService);

  protected async onLogout(): Promise<void> {
    await this.auth.logout();
    this.closeModal.emit();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closeModal.emit();
    }
  }
}
