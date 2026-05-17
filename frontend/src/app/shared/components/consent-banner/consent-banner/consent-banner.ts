import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConsentService } from '../../../../core/consent/consent.service';
import { IconsModule } from '../../../icons/icons.module';

@Component({
  selector: 'lba-consent-banner',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './consent-banner.html',
  styleUrl: './consent-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentBanner {
  readonly consent = inject(ConsentService);
}
