import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { SeoService } from '../../core/seo/seo.service';

interface ExperienceOptimization {
  role: string;
  company: string;
  improvedBullets: string[];
}

interface LinkedInOptimization {
  headline: string;
  about: string;
  experience: ExperienceOptimization[];
}

@Component({
  selector: 'lba-linkedin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './linkedin.component.html',
  styleUrl: './linkedin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedInComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<LinkedInOptimization | null>(null);
  readonly copiedField = signal<string | null>(null);

  readonly form = new FormGroup({
    profileText: new FormControl('', [Validators.required, Validators.minLength(50)]),
    targetRole:  new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  constructor() {
    inject(SeoService).setPage('LinkedIn-Profil optimieren', 'LinkedIn-Profil mit KI optimieren — Headline, About und Erfahrungen verbessern.', '/app/linkedin');
  }

  async optimize(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      const data = await this.api.post<LinkedInOptimization>('/linkedin/optimize', {
        profileText: this.form.value.profileText,
        targetRole:  this.form.value.targetRole,
      });
      this.result.set(data);
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 403) {
        this.error.set('Diese Funktion ist nur für PRO-Nutzer verfügbar. Bitte upgraden.');
      } else {
        this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Optimierung fehlgeschlagen. Bitte erneut versuchen.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async copyField(text: string, field: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedField.set(field);
      setTimeout(() => this.copiedField.set(null), 2000);
    } catch {
      this.error.set('Text konnte nicht kopiert werden.');
    }
  }
}
