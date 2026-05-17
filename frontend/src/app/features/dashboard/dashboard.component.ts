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
