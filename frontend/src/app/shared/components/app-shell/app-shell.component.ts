import { ChangeDetectionStrategy, Component, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { EinstellungenModalComponent } from '../einstellungen-modal/einstellungen-modal.component';
import { OnboardingModalComponent } from '../onboarding-modal/onboarding-modal';
import { UpgradeService } from '../../services/upgrade.service';
import { IconsModule } from '../../icons/icons.module';
import { AppTopbarComponent, type BreadcrumbItem } from '../app-topbar/app-topbar';
import { CommandPaletteComponent } from '../command-palette/command-palette';
import type { DashboardData } from '../../models/dashboard.model';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EinstellungenModalComponent, OnboardingModalComponent, IconsModule, AppTopbarComponent, CommandPaletteComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  @ViewChild(CommandPaletteComponent) private commandPalette?: CommandPaletteComponent;

  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly upgradeService = inject(UpgradeService);

  protected readonly einstellungenOpen = signal(false);
  protected readonly workspaceMenuOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly onboardingOpen = computed(() => this.auth.user() !== null && !(this.auth.user()?.onboardingShown ?? true));

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isEditorRoute = computed(() => /^\/app\/applications\/[^/?#]+/.test(this.currentUrl()));
  readonly isDashboardRoute = computed(() => this.currentUrl().split(/[?#]/)[0] === '/app');

  readonly crumbs = computed((): BreadcrumbItem[] => {
    if (this.isEditorRoute()) return [{ label: 'Bewerbungen' }];
    const segment = this.currentUrl().split(/[?#]/)[0].split('/').filter(Boolean).at(-1) ?? '';
    const label = ROUTE_LABELS[segment] ?? segment;
    return [{ label: 'Workspace' }, { label }];
  });

  private readonly AVATAR_PALETTE = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'HF';
  });

  readonly avatarColor = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return this.AVATAR_PALETTE[name.length % this.AVATAR_PALETTE.length];
  });

  readonly avatarBgColor = computed(() => this.avatarColor());

  readonly counts = signal({ applications: 0, cvs: 0 });

  constructor() {
    effect(() => {
      if (this.upgradeService.requested()) {
        this.einstellungenOpen.set(true);
        this.upgradeService.clear();
      }
    });

    void this.loadStats();
  }

  private async loadStats(): Promise<void> {
    try {
      const data = await this.api.get<DashboardData>('/users/me/dashboard');
      this.counts.set({ applications: data.applicationCount, cvs: data.cvCount });
    } catch {
      // sidebar badges stay at 0 — non-critical, page-level components show their own errors
    }
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

  protected toggleWorkspaceSwitcher(): void {
    this.workspaceMenuOpen.update(open => !open);
    this.notificationsOpen.set(false);
  }

  protected closeWorkspaceSwitcher(): void {
    this.workspaceMenuOpen.set(false);
  }

  protected toggleNotifications(): void {
    this.notificationsOpen.update(open => !open);
    this.workspaceMenuOpen.set(false);
  }

  protected openCommandPalette(): void {
    void this.commandPalette?.open();
  }

  protected editProfile(): void {
    this.einstellungenOpen.set(true);
    this.closeWorkspaceSwitcher();
  }

  protected dismissOnboarding(): void {
    const user = this.auth.user();
    if (user) this.auth.user.set({ ...user, onboardingShown: true });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
