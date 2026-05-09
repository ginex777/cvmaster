import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

export interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  jobPosting: { parsedJson: { title?: string } };
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
  private http = inject(HttpClient);
  auth = inject(AuthService);

  applications = signal<Application[]>([]);
  loading      = signal(true);

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.http.get<Application[]>('/api/applications'));
      this.applications.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  scoreClass(score: number) {
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
