import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'lba-app-topbar',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './app-topbar.html',
  styleUrl: './app-topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTopbarComponent {
  readonly crumbs = input<BreadcrumbItem[]>([]);
  readonly hasUnread = input<boolean>(false);
  readonly commandPaletteRequested = output<void>();
  readonly notificationsRequested = output<void>();
}
