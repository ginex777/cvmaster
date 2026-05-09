import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

type LetterVariant = 'formal' | 'warm' | 'brief';

interface MatchReport {
  summary?: string;
  keywords?: string[];
  missingKeywords?: string[];
  strengths?: string[];
}

interface ApplicationDto {
  id: string;
  status?: string;
  matchScore?: number | null;
  atsScore?: number | null;
  optimizedCv?: unknown;
  coverLetter?: Record<string, string>;
  matchReport?: MatchReport;
  jobPosting?: { parsedJson?: { title?: string; company?: string; keywords?: string[] } };
}

@Component({
  selector: 'lba-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly application = signal<ApplicationDto | null>(null);
  readonly selectedLetter = signal<LetterVariant>('formal');

  readonly editorForm = new FormGroup({
    cvText: new FormControl('', { nonNullable: true }),
    formal: new FormControl('', { nonNullable: true }),
    warm: new FormControl('', { nonNullable: true }),
    brief: new FormControl('', { nonNullable: true }),
  });

  readonly score = computed(() => this.application()?.matchScore ?? this.application()?.atsScore ?? null);
  readonly matchReport = computed(() => this.application()?.matchReport ?? {});
  readonly keywords = computed(() => {
    const report = this.matchReport();
    const jobKeywords = this.application()?.jobPosting?.parsedJson?.keywords ?? [];
    return report.keywords?.length ? report.keywords : jobKeywords;
  });
  readonly missingKeywords = computed(() => this.matchReport().missingKeywords ?? []);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    if (!this.id) {
      this.error.set('Bewerbung konnte nicht gefunden werden.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const app = await this.api.get<ApplicationDto>(`/applications/${this.id}`);
      this.application.set(app);
      this.editorForm.patchValue({
        cvText: this.optimizedCvToText(app.optimizedCv),
        formal: app.coverLetter?.['formal'] ?? '',
        warm: app.coverLetter?.['warm'] ?? app.coverLetter?.['casual'] ?? '',
        brief: app.coverLetter?.['brief'] ?? '',
      });
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  letterControl(): FormControl<string> {
    return this.editorForm.controls[this.selectedLetter()];
  }

  async saveCv(): Promise<void> {
    await this.patchApplication({
      optimizedCv: {
        text: this.editorForm.controls.cvText.value,
        sections: this.textToSections(this.editorForm.controls.cvText.value),
      },
    });
  }

  async saveCoverLetter(): Promise<void> {
    await this.patchApplication({
      coverLetter: {
        formal: this.editorForm.controls.formal.value,
        warm: this.editorForm.controls.warm.value,
        brief: this.editorForm.controls.brief.value,
      },
    });
  }

  async setStatus(status: string): Promise<void> {
    await this.patchApplication({ status });
  }

  private async patchApplication(body: Record<string, unknown>): Promise<void> {
    if (!this.id) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const updated = await this.api.patch<ApplicationDto>(`/applications/${this.id}`, body);
      this.application.set(updated);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Ã„nderungen konnten nicht gespeichert werden.');
    } finally {
      this.saving.set(false);
    }
  }

  private optimizedCvToText(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (this.hasEditorText(value)) return value.text;
    if (this.hasSections(value)) {
      return value.sections.map(section => `${section.heading}\n${section.lines.join('\n')}`).join('\n\n');
    }
    if (this.hasExperience(value)) {
      return value.experience
        .map(section => `${section.role} @ ${section.company}\n${section.bullets.map(bullet => bullet.text).join('\n')}`)
        .join('\n\n');
    }
    return JSON.stringify(value, null, 2);
  }

  private textToSections(text: string): Array<{ heading: string; lines: string[] }> {
    return text
      .split(/\n{2,}/)
      .map(block => block.split('\n').map(line => line.trim()).filter(Boolean))
      .filter(lines => lines.length > 0)
      .map(([heading, ...lines]) => ({ heading, lines }));
  }

  private hasEditorText(value: unknown): value is { text: string } {
    return typeof value === 'object' && value !== null && 'text' in value && typeof (value as { text?: unknown }).text === 'string';
  }

  private hasSections(value: unknown): value is { sections: Array<{ heading: string; lines: string[] }> } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { sections?: unknown }).sections);
  }

  private hasExperience(value: unknown): value is {
    experience: Array<{ company: string; role: string; bullets: Array<{ text: string }> }>;
  } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { experience?: unknown }).experience);
  }
}
