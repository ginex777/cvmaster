import { type OnInit, Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';

interface RecentApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  cvCount: number;
  applicationCount: number;
  recentApplications: RecentApplication[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);

  async ngOnInit(): Promise<void> {
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
      DRAFT: 'Entwurf', EXPORTED: 'Exportiert', SENT: 'Gesendet',
      REPLIED: 'Antwort', INTERVIEW: 'Interview', REJECTED: 'Abgelehnt', OFFER: 'Angebot',
    };
    return labels[status] ?? status;
  }
}
