import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { BillingComponent } from '../../../features/billing/billing.component';
import { SecurityComponent } from '../../../features/security/security.component';

type Tab = 'abrechnung' | 'sicherheit';

@Component({
  selector: 'lba-einstellungen-modal',
  standalone: true,
  imports: [BillingComponent, SecurityComponent],
  templateUrl: './einstellungen-modal.component.html',
  styleUrl: './einstellungen-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EinstellungenModalComponent {
  readonly open = input(false);
  readonly closeModal = output<void>();

  protected readonly activeTab = signal<Tab>('abrechnung');

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  protected onBackdropClick(): void {
    this.closeModal.emit();
  }

  protected onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closeModal.emit();
    }
  }
}
