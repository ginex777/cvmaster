import { type OnInit, Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';

interface RecentApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  onboardingDismissed: boolean;
  cvCount: number;
  applicationCount: number;
  avgMatchScore: number | null;
  recentApplications: RecentApplication[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDeleteModal],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly dismissingOnboarding = signal(false);

  readonly onboardingSteps = computed(() => {
    const d = this.data();
    if (!d) return null;
    const exported = d.recentApplications.some(a =>
      ['EXPORTED', 'SENT', 'REPLIED', 'INTERVIEW', 'OFFER'].includes(a.status),
    );
    return { cvUploaded: d.cvCount > 0, applicationCreated: d.applicationCount > 0, exported };
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

  scoreClass(score: number): string {
    if (score >= 80) return 'score--high';
    if (score >= 60) return 'score--mid';
    return 'score--low';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Wird optimiert...',
      OPEN: 'Offen',
      DONE: 'Erledigt',
      EXPORTED: 'Exportiert',
      SENT: 'Gesendet',
      REPLIED: 'Antwort',
      INTERVIEW: 'Interview',
      REJECTED: 'Abgelehnt',
      OFFER: 'Angebot',
    };
    return labels[status] ?? status;
  }

  async toggleStatus(id: string): Promise<void> {
    const dashboard = this.data();
    const app = dashboard?.recentApplications.find(item => item.id === id);
    if (!dashboard || !app) return;

    const previous = app.status;
    const status = previous === 'DONE' ? 'OPEN' : 'DONE';
    this.updateApplicationInList(id, { status });
    this.error.set(null);

    try {
      await this.api.patch(`/applications/${id}/status`, { status });
    } catch (e: unknown) {
      this.updateApplicationInList(id, { status: previous });
      this.error.set(this.errorMessage(e, 'Status konnte nicht geändert werden.'));
    }
  }

  requestDelete(id: string): void {
    this.deletingId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;

    this.error.set(null);
    try {
      await this.api.delete(`/applications/${id}`);
      this.data.update(current => current ? {
        ...current,
        applicationCount: Math.max(0, current.applicationCount - 1),
        recentApplications: current.recentApplications.filter(app => app.id !== id),
      } : current);
    } catch (e: unknown) {
      this.error.set(this.errorMessage(e, 'Löschen fehlgeschlagen. Bitte erneut versuchen.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  async dismissOnboarding(): Promise<void> {
    this.dismissingOnboarding.set(true);
    try {
      await this.api.post('/users/me/dismiss-onboarding', {});
      this.data.update(d => d ? { ...d, onboardingDismissed: true } : d);
    } catch {
      // silently fail — checklist stays visible if the request fails
    } finally {
      this.dismissingOnboarding.set(false);
    }
  }

  companyName(app: RecentApplication): string {
    return app.jobPosting.parsedJson.company ?? 'Unbekannt';
  }

  jobTitle(app: RecentApplication): string {
    return app.jobPosting.parsedJson.title ?? 'Position offen';
  }

  private updateApplicationInList(id: string, patch: Partial<RecentApplication>): void {
    this.data.update(current => current ? {
      ...current,
      recentApplications: current.recentApplications.map(app => app.id === id ? { ...app, ...patch } : app),
    } : current);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && this.hasMessage(error.error)) {
      return error.error.message;
    }
    return fallback;
  }

  private hasMessage(value: unknown): value is { message: string } {
    return typeof value === 'object' && value !== null && typeof (value as { message?: unknown }).message === 'string';
  }
}
