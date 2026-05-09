import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrialApiService } from '../../core/api/trial.service';
import type { TrialResponse } from '../../core/api/trial.service';

@Component({
  selector: 'lba-try',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './try.component.html',
  styleUrl: './try.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TryComponent {
  private readonly trialApi = inject(TrialApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<TrialResponse | null>(null);

  readonly form = new FormGroup({
    cvText: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(40)] }),
    jobText: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(40)] }),
  });

  async runTrial(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    try {
      const result = await this.trialApi.analyze(
        this.form.controls.cvText.value,
        this.form.controls.jobText.value,
      );
      this.result.set(result);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse
          ? e.error.message
          : 'Die Demo konnte gerade nicht gestartet werden. Bitte pruefe die Texte und versuche es erneut.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
