import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill';
import { IconsModule } from '../../shared/icons/icons.module';
import { STATUS_META, type ApplicationStatus } from '../../shared/utils/status.utils';

interface RecentApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  reminderAt?: string | null;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  onboardingDismissed: boolean;
  cvCount: number;
  applicationCount: number;
  avgMatchScore: number | null;
  recentApplications: RecentApplication[];
}

type Period = 'today' | '7d' | '30d' | 'all';

interface PipelineColumn {
  key: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  count: number;
  apps: RecentApplication[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, EditorModalComponent, StatusPillComponent, IconsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly selectedAppId = signal<string | null>(null);
  readonly openMenuAppId = signal<string | null>(null);
  readonly statusSubmenuOpen = signal(false);
  readonly period = signal<Period>('30d');
  readonly periodMenuOpen = signal(false);

  protected readonly STATUS_OPTIONS: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
  protected readonly statusMeta = STATUS_META;

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  });

  readonly firstName = computed(() => {
    const name = this.data() ? 'Lina' : '';
    return name;
  });

  private static readonly PERIOD_MS: Record<Period, number> = {
    today: 86_400_000,
    '7d': 7 * 86_400_000,
    '30d': 30 * 86_400_000,
    all: Infinity,
  };

  private static readonly PERIOD_LABELS: Record<Period, string> = {
    today: 'Heute',
    '7d': 'Letzte 7 Tage',
    '30d': 'Letzte 30 Tage',
    all: 'Alle',
  };

  readonly periodLabel = computed(() => DashboardComponent.PERIOD_LABELS[this.period()]);

  readonly filteredApplications = computed(() => {
    const apps = this.data()?.recentApplications ?? [];
    const ms = DashboardComponent.PERIOD_MS[this.period()];
    if (ms === Infinity) return apps;
    const now = Date.now();
    return apps.filter(a => now - new Date(a.createdAt).getTime() <= ms);
  });

  readonly appliedCount = computed(() =>
    this.filteredApplications().filter(a => this.toApplicationStatus(a.status) !== 'DRAFT').length
  );

  readonly interviewedCount = computed(() =>
    this.filteredApplications().filter(a => {
      const s = this.toApplicationStatus(a.status);
      return s === 'INTERVIEW' || s === 'OFFER' || s === 'REJECTED';
    }).length
  );

  readonly responseRate = computed(() => {
    const total = this.appliedCount();
    return total > 0 ? Math.round((this.interviewedCount() / total) * 100) : 0;
  });

  readonly nextReminder = computed((): { label: string; sub: string } | null => {
    const apps = this.data()?.recentApplications ?? [];
    const upcoming = apps
      .filter(a => !!a.reminderAt)
      .sort((a, b) => new Date(a.reminderAt!).getTime() - new Date(b.reminderAt!).getTime());
    if (upcoming.length === 0) return null;
    const first = upcoming[0];
    const d = new Date(first.reminderAt!);
    const label = `${d.toLocaleDateString('de-DE', { weekday: 'short' })}, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    return { label, sub: `${this.companyName(first)} nachfassen` };
  });

  readonly pipelineColumns = computed((): PipelineColumn[] => {
    const apps = this.data()?.recentApplications ?? [];
    const statuses: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
    return statuses.map(status => {
      const meta = STATUS_META[status];
      const colApps = apps.filter(a => this.toApplicationStatus(a.status) === status);
      return {
        key: status,
        label: meta.label,
        color: meta.color,
        bg: meta.bg,
        count: colApps.length,
        apps: colApps.slice(0, 2),
      };
    });
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.get<DashboardData>('/users/me/dashboard'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Daten konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  setPeriod(p: Period, event: Event): void {
    event.stopPropagation();
    this.period.set(p);
    this.periodMenuOpen.set(false);
  }

  togglePeriodMenu(event: Event): void {
    event.stopPropagation();
    this.periodMenuOpen.set(!this.periodMenuOpen());
  }

  closePeriodMenu(): void {
    this.periodMenuOpen.set(false);
  }

  toggleMenu(appId: string, event: Event): void {
    event.stopPropagation();
    if (this.openMenuAppId() === appId) {
      this.openMenuAppId.set(null);
      this.statusSubmenuOpen.set(false);
    } else {
      this.openMenuAppId.set(appId);
      this.statusSubmenuOpen.set(false);
    }
  }

  closeMenu(): void {
    this.openMenuAppId.set(null);
    this.statusSubmenuOpen.set(false);
  }

  toApplicationStatus(status: string): ApplicationStatus {
    const map: Record<string, ApplicationStatus> = {
      DRAFT: 'DRAFT', OPEN: 'APPLIED', DONE: 'APPLIED', EXPORTED: 'APPLIED',
      SENT: 'APPLIED', REPLIED: 'INTERVIEW', INTERVIEW: 'INTERVIEW',
      OFFER: 'OFFER', REJECTED: 'REJECTED',
    };
    return map[status] ?? 'DRAFT';
  }

  statusColor(status: string): string {
    return STATUS_META[this.toApplicationStatus(status)].color;
  }

  companyName(app: RecentApplication): string {
    return app.jobPosting.parsedJson.company ?? 'Unbekannt';
  }

  companyInitials(app: RecentApplication): string {
    return this.companyName(app)
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  jobTitle(app: RecentApplication): string {
    return app.jobPosting.parsedJson.title ?? 'Position offen';
  }
}
