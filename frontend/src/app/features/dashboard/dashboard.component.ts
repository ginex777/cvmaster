import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill';
import { IconsModule } from '../../shared/icons/icons.module';
import { legacyToStatus, STATUS_META, type ApplicationStatus } from '../../shared/utils/status.utils';
import type { Application as RecentApplication, DashboardData } from '../../shared/models/dashboard.model';

type Period = 'today' | '7d' | '30d' | 'all';

interface PipelineColumn {
  key: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  count: number;
  apps: RecentApplication[];
}

interface DashboardReminder {
  id: string;
  company: string;
  role: string;
  date: string;
  time: string;
  kind: string;
  color: string;
  icon: 'mail' | 'calendar' | 'bell';
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, EditorModalComponent, ConfirmDeleteModal, StatusPillComponent, IconsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly selectedAppId = signal<string | null>(null);
  readonly openMenuAppId = signal<string | null>(null);
  readonly deletingAppId = signal<string | null>(null);
  readonly statusSubmenuOpen = signal(false);
  readonly reminderPickerOpen = signal(false);
  readonly reminderDate = signal('');
  readonly period = signal<Period>('30d');
  readonly periodMenuOpen = signal(false);

  protected readonly STATUS_OPTIONS: ApplicationStatus[] = ['DRAFT', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
  protected readonly statusMeta = STATUS_META;

  protected readonly statCardStyles = [
    { tone: 'var(--status-applied)',   iconBg: 'oklch(97% 0.030 240)' },
    { tone: 'var(--status-interview)', iconBg: 'oklch(97% 0.025 295)' },
    { tone: 'var(--status-offer)',     iconBg: 'oklch(97% 0.030 155)' },
    { tone: 'var(--warn)',             iconBg: 'oklch(97% 0.030 60)'  },
  ] as const;

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  });

  readonly firstName = computed(() => {
    const name = this.auth.user()?.name?.trim() ?? '';
    return name.split(/\s+/)[0] ?? '';
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
      .sort((a, b) => new Date(a.reminderAt ?? '').getTime() - new Date(b.reminderAt ?? '').getTime());
    if (upcoming.length === 0) return null;
    const first = upcoming[0];
    const d = new Date(first.reminderAt ?? '');
    const label = `${d.toLocaleDateString('de-DE', { weekday: 'short' })}, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    return { label, sub: `${this.companyName(first)} nachfassen` };
  });

  readonly reminders = computed((): DashboardReminder[] => {
    const apps = this.data()?.recentApplications ?? [];
    return apps
      .filter(a => !!a.reminderAt)
      .sort((a, b) => new Date(a.reminderAt ?? '').getTime() - new Date(b.reminderAt ?? '').getTime())
      .slice(0, 3)
      .map((app, index) => {
        const d = new Date(app.reminderAt ?? '');
        const status = this.toApplicationStatus(app.status);
        return {
          id: app.id,
          company: this.companyName(app),
          role: this.jobTitle(app),
          date: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }),
          time: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          kind: index === 0 ? 'Follow-up' : status === 'INTERVIEW' ? 'Interview' : 'Antwort',
          color: STATUS_META[status].color,
          icon: index === 0 ? 'mail' : status === 'INTERVIEW' ? 'calendar' : 'bell',
        };
      });
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
    this.reminderPickerOpen.set(false);
    this.reminderDate.set('');
  }

  requestDelete(id: string): void {
    this.deletingAppId.set(id);
    this.closeMenu();
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingAppId();
    if (!id) return;
    this.error.set(null);
    try {
      await this.api.delete(`/applications/${id}`);
      this.data.update(d => d
        ? {
            ...d,
            applicationCount: Math.max(0, d.applicationCount - 1),
            recentApplications: d.recentApplications.filter(a => a.id !== id),
          }
        : d
      );
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht gelöscht werden.');
    } finally {
      this.deletingAppId.set(null);
    }
  }

  async onStatusChange(id: string, status: ApplicationStatus): Promise<void> {
    const previous = this.data()?.recentApplications.find(a => a.id === id)?.status;
    this.data.update(d => d ? {
      ...d,
      recentApplications: d.recentApplications.map(a => a.id === id ? { ...a, status } : a),
    } : d);
    try {
      await this.api.patch(`/applications/${id}/status`, { status });
    } catch (e: unknown) {
      if (previous) {
        this.data.update(d => d ? {
          ...d,
          recentApplications: d.recentApplications.map(a => a.id === id ? { ...a, status: previous } : a),
        } : d);
      }
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Status konnte nicht geändert werden.');
    }
  }

  openReminderPicker(event: Event): void {
    event.stopPropagation();
    this.statusSubmenuOpen.set(false);
    this.reminderPickerOpen.set(true);
    this.reminderDate.set('');
  }

  async setReminder(appId: string): Promise<void> {
    const date = this.reminderDate();
    if (!date) return;
    const reminderAt = new Date(date).toISOString();
    const previous = this.data()?.recentApplications.find(a => a.id === appId)?.reminderAt ?? null;
    this.data.update(d => d ? {
      ...d,
      recentApplications: d.recentApplications.map(a => a.id === appId ? { ...a, reminderAt } : a),
    } : d);
    try {
      await this.api.patch(`/applications/${appId}/reminder`, { reminderAt });
      this.closeMenu();
    } catch (e: unknown) {
      this.data.update(d => d ? {
        ...d,
        recentApplications: d.recentApplications.map(a => a.id === appId ? { ...a, reminderAt: previous } : a),
      } : d);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Erinnerung konnte nicht gespeichert werden.');
    }
  }

  async clearReminder(appId: string): Promise<void> {
    const previous = this.data()?.recentApplications.find(a => a.id === appId)?.reminderAt ?? null;
    this.data.update(d => d ? {
      ...d,
      recentApplications: d.recentApplications.map(a => a.id === appId ? { ...a, reminderAt: null } : a),
    } : d);
    try {
      await this.api.patch(`/applications/${appId}/reminder`, { reminderAt: null });
      this.closeMenu();
    } catch (e: unknown) {
      this.data.update(d => d ? {
        ...d,
        recentApplications: d.recentApplications.map(a => a.id === appId ? { ...a, reminderAt: previous } : a),
      } : d);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Erinnerung konnte nicht gelöscht werden.');
    }
  }

  toApplicationStatus(status: string): ApplicationStatus {
    return legacyToStatus(status, true);
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
