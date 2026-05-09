import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrialApiService } from '../../core/api/trial.service';
import type { TrialResponse } from '../../core/api/trial.service';

export type TryStep = 'cv' | 'job' | 'result';

@Component({
  selector: 'lba-try',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './try.component.html',
  styleUrl: './try.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TryComponent {
  private readonly trialApi = inject(TrialApiService);

  step       = signal<TryStep>('cv');
  cvText     = signal('');
  jobText    = signal('');
  loading    = signal(false);
  matchScore = signal(0);
  error      = signal('');
  result     = signal<TrialResponse | null>(null);

  async runTrial() {
    this.loading.set(true);
    this.error.set('');

    try {
      const result = await this.trialApi.analyze(this.cvText(), this.jobText());
      this.result.set(result);
      this.matchScore.set(result.matchScore);
      this.step.set('result');
    } catch {
      this.error.set('Die Optimierung konnte gerade nicht gestartet werden. Bitte prüfe die Texte und versuche es erneut.');
    } finally {
      this.loading.set(false);
    }
  }
}
