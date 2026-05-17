import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { ToastService, type ToastType } from '../../services/toast.service';

@Component({
  selector: 'lba-toast-host',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  iconName(type: ToastType): string {
    const map: Record<ToastType, string> = {
      success: 'check',
      error:   'alert-circle',
      info:    'bell',
    };
    return map[type];
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
