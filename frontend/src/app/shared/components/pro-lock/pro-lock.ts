import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { UpgradeService } from '../../services/upgrade.service';

@Component({
  selector: 'lba-pro-lock',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './pro-lock.html',
  styleUrl: './pro-lock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProLockComponent {
  readonly mode = input<'pill' | 'overlay'>('pill');
  readonly tooltip = input('Upgrade auf Pro nötig');

  private readonly upgradeService = inject(UpgradeService);

  unlock(): void {
    this.upgradeService.request();
  }
}
