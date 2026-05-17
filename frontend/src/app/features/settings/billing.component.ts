import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { IconsModule } from '../../shared/icons/icons.module';

interface BillingRuntimeConfig {
  paddleCustomerPortalUrl?: string;
}

@Component({
  selector: 'lba-settings-billing',
  standalone: true,
  imports: [RouterLink, IconsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBillingComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  get customerPortalUrl(): string {
    const overrides = (globalThis as { __LBA_CONFIG__?: BillingRuntimeConfig }).__LBA_CONFIG__;
    return overrides?.paddleCustomerPortalUrl ?? environment.paddleCustomerPortalUrl;
  }

  planLabel(plan: string | undefined): string {
    const labels: Record<string, string> = {
      FREE: 'Free', PAY_PER_APP: 'Pay-per-App', PRO: 'Pro',
      free: 'Free', pay: 'Pay-per-App', pro: 'Pro',
    };
    return labels[plan ?? ''] ?? 'Free';
  }
}
