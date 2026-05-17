import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { EinstellungenModalComponent } from '../einstellungen-modal/einstellungen-modal.component';
import { UpgradeService } from '../../services/upgrade.service';
import { IconsModule } from '../../icons/icons.module';
import { AppTopbarComponent, type BreadcrumbItem } from '../app-topbar/app-topbar';

const ROUTE_LABELS: Record<string, string> = {
  '':             'Dashboard',
  'applications': 'Bewerbungen',
  'pipeline':     'Pipeline',
  'cvs':          'Lebensläufe',
  'linkedin':     'LinkedIn',
  'settings':     'Einstellungen',
  'wizard':       'Neue Bewerbung',
  'billing':      'Abrechnung',
  'security':     'Sicherheit',
};

@Component({
  selector: 'lba-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EinstellungenModalComponent, IconsModule, AppTopbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly upgradeService = inject(UpgradeService);

  protected readonly einstellungenOpen = signal(false);

  readonly crumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const segment = this.router.url.split('/').filter(Boolean).at(-1) ?? '';
        const label = ROUTE_LABELS[segment] ?? segment;
        return [{ label: 'Workspace' }, { label }] as BreadcrumbItem[];
      }),
    ),
    { initialValue: [{ label: 'Workspace' }, { label: 'Dashboard' }] as BreadcrumbItem[] },
  );

  private readonly AVATAR_PALETTE = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'HF';
  });

  readonly avatarColor = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return this.AVATAR_PALETTE[name.length % this.AVATAR_PALETTE.length];
  });

  readonly avatarBgColor = computed(() => `${this.avatarColor()}22`);

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
