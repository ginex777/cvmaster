import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly step = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cvs = signal<MasterCv[]>([]);
  readonly selectedCvId = signal<string | null>(null);

  readonly jobForm = new FormGroup({
    jobRaw: new FormControl('', [Validators.required, Validators.minLength(50)]),
  });

  async ngOnInit(): Promise<void> {
    try {
      this.cvs.set(await this.api.get<MasterCv[]>('/cvs'));
    } catch {
      this.error.set('Lebensläufe konnten nicht geladen werden.');
    }
  }

  selectCv(id: string): void {
    this.selectedCvId.set(id);
    this.step.set(2);
  }

  nextStep(): void {
    if (this.jobForm.valid) {
      this.error.set(null);
      this.step.set(3);
    }
  }

  async generate(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const job = await this.api.post<{ id: string }>('/jobs/parse', {
        type: 'text',
        value: this.jobForm.value.jobRaw,
      });
      const app = await this.api.post<{ id: string }>('/applications', {
        masterCvId: this.selectedCvId(),
        jobPostingId: job.id,
      });
      await this.router.navigate(['/app/applications', app.id]);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht erstellt werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
