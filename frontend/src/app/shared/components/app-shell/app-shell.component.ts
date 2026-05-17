import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { EinstellungenModalComponent } from '../einstellungen-modal/einstellungen-modal.component';
import { UpgradeService } from '../../services/upgrade.service';
import { IconsModule } from '../../icons/icons.module';

@Component({
  selector: 'lba-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EinstellungenModalComponent, IconsModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly upgradeService = inject(UpgradeService);

  protected readonly einstellungenOpen = signal(false);

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'HF';
  });

  readonly counts = signal({ applications: 0, cvs: 0, used: 0, limit: 5, percent: 0 });

  constructor() {
    effect(() => {
      if (this.upgradeService.requested()) {
        this.einstellungenOpen.set(true);
        this.upgradeService.clear();
      }
    }, { allowSignalWrites: true });
  }

  protected isPro(): boolean {
    const plan = this.auth.user()?.plan;
    return plan === 'PRO' || plan === 'pro';
  }

  protected planLabel(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'Pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'Pay-per-App';
    return 'Free';
  }

  protected planClass(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'pay';
    return 'free';
  }

  protected openWorkspaceSwitcher(): void {
    // workspace switcher — stub for Phase 3, full implementation in Phase 6
  }

  protected linkedInClick(): void {
    if (this.isPro()) {
      void this.router.navigate(['/app/linkedin']);
    } else {
      this.einstellungenOpen.set(true);
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
