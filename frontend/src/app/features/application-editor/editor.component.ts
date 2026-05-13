import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';

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
  chosenVariant?: string | null;
  generationProgress?: number;
  generationError?: string | null;
  jobPosting?: { parsedJson?: { title?: string; company?: string; keywords?: string[] } };
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

@Component({
  selector: 'lba-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDeleteModal],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly saving = signal(false);
  readonly downloading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly application = signal<ApplicationDto | null>(null);
  readonly selectedLetter = signal<LetterVariant>('formal');
  readonly regenConfirmOpen = signal(false);
  readonly letterVariants: LetterVariant[] = ['formal', 'warm', 'brief'];

  readonly editorForm = new FormGroup({
    cvText: new FormControl('', { nonNullable: true }),
    formal: new FormControl('', { nonNullable: true }),
    warm: new FormControl('', { nonNullable: true }),
    brief: new FormControl('', { nonNullable: true }),
    recipientEmail: new FormControl('', { nonNullable: true }),
  });

  readonly score = computed(() => this.application()?.matchScore ?? this.application()?.atsScore ?? null);
  readonly matchReport = computed(() => this.application()?.matchReport ?? {});
  readonly keywords = computed(() => {
    const report = this.matchReport();
    const jobKeywords = this.application()?.jobPosting?.parsedJson?.keywords ?? [];
    return report.keywords?.length ? report.keywords : jobKeywords;
  });
  readonly missingKeywords = computed(() => this.matchReport().missingKeywords ?? []);
  readonly isLoading = computed(() => this.loading());
  readonly isGenerating = computed(() => this.generating());
  readonly isSaving = computed(() => this.saving());
  readonly isDownloading = computed(() => this.downloading());
  readonly isSending = computed(() => this.sending());
  readonly errorMessage = computed(() => this.error());
  readonly statusMessage = computed(() => this.message());
  readonly generationProgress = computed(() => this.application()?.generationProgress ?? 0);
  readonly generationError = computed(() => this.application()?.generationError ?? null);
  readonly generationFailed = computed(() => this.application()?.status === 'FAILED' || !!this.generationError());
  readonly currentScore = computed(() => this.score());
  readonly currentMatchReport = computed(() => this.matchReport());
  readonly matchedKeywords = computed(() => this.keywords());
  readonly currentMissingKeywords = computed(() => this.missingKeywords());
  readonly selectedLetterValue = computed(() => this.selectedLetter());

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  ngOnDestroy(): void {
    this.clearPoll();
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

      if (app.status === 'FAILED' || app.generationError) {
        this.generating.set(false);
        this.error.set(app.generationError ?? 'KI-Generierung fehlgeschlagen. Bitte versuche es erneut.');
      } else if (!app.optimizedCv) {
        this.generating.set(true);
        this.schedulePoll(0);
      } else {
        this.generating.set(false);
        this.populateForm(app);
      }
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  letterControl(): FormControl<string> {
    return this.editorForm.controls[this.selectedLetter()];
  }

  async selectLetter(variant: LetterVariant): Promise<void> {
    const previous = this.selectedLetter();
    this.selectedLetter.set(variant);

    try {
      await this.patchApplication({ chosenVariant: variant });
    } catch {
      this.selectedLetter.set(previous);
    }
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

  async setStatus(status: 'OPEN' | 'DONE'): Promise<void> {
    const previous = this.application();
    this.application.update(app => app ? { ...app, status } : app);

    try {
      const updated = await this.api.patch<ApplicationDto>(`/applications/${this.id}/status`, { status });
      this.application.update(current => ({ ...(current ?? { id: this.id }), ...updated }));
    } catch {
      this.application.set(previous);
    }
  }

  async downloadPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/pdf`, 'Lebenslauf.pdf');
  }

  async downloadCvPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/cv`, 'Lebenslauf.pdf');
  }

  async downloadLetterPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/letter`, 'Anschreiben.pdf');
  }

  async downloadBundle(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/bundle`, 'Bewerbung.zip');
  }

  async sendToSelf(): Promise<void> {
    if (!this.id) return;
    this.sending.set(true);
    this.error.set(null);
    this.message.set(null);
    try {
      await this.api.post(`/applications/${this.id}/email-to-self`, {});
      this.message.set('Bewerbungsunterlagen wurden an deine E-Mail-Adresse gesendet.');
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'E-Mail konnte nicht gesendet werden.');
    } finally {
      this.sending.set(false);
    }
  }

  openMailto(): void {
    const href = this.mailtoHref();
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  }

  mailtoHref(): string {
    const recipient = this.editorForm.controls.recipientEmail.value.trim();
    const subject = `Bewerbung${this.jobTitle() ? ` als ${this.jobTitle()}` : ''}`;
    const body = [
      this.letterControl().value,
      '',
      'Hinweis: Bitte fuege die heruntergeladenen PDF-Dateien als Anhang hinzu.',
    ].join('\n');

    return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  openRegenConfirm(): void {
    this.regenConfirmOpen.set(true);
  }

  async confirmRegen(): Promise<void> {
    if (!this.id) return;

    this.regenConfirmOpen.set(false);
    this.generating.set(true);
    this.error.set(null);
    try {
      await this.api.post(`/applications/${this.id}/regenerate-letter`, {});
      this.schedulePoll(0);
    } catch (e: unknown) {
      this.generating.set(false);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Neu-Generierung fehlgeschlagen. Bitte erneut versuchen.');
    }
  }

  async retryGeneration(): Promise<void> {
    if (!this.id) return;

    this.generating.set(true);
    this.error.set(null);
    this.application.update(app => app
      ? { ...app, status: 'DRAFT', generationProgress: 0, generationError: null }
      : app);

    try {
      await this.api.post(`/applications/${this.id}/retry-generation`, {});
      this.schedulePoll(0);
    } catch (e: unknown) {
      this.generating.set(false);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'KI-Generierung konnte nicht neu gestartet werden.');
    }
  }

  variantLabel(variant: LetterVariant): string {
    return { formal: 'Formal', warm: 'Freundlich', brief: 'Knapp' }[variant];
  }

  private jobTitle(): string {
    return this.application()?.jobPosting?.parsedJson?.title ?? '';
  }

  private async downloadFile(path: string, filename: string): Promise<void> {
    if (!this.id) return;
    this.downloading.set(true);
    this.error.set(null);
    try {
      const blob = await this.api.getBlob(path);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Download fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      this.downloading.set(false);
    }
  }

  private schedulePoll(attempt: number): void {
    this.clearPoll();
    if (attempt >= POLL_MAX_ATTEMPTS) {
      this.generating.set(false);
      this.error.set('KI-Generierung hat zu lange gedauert. Bitte Seite neu laden.');
      return;
    }

    this.pollTimer = setTimeout(async () => {
      try {
        const app = await this.api.get<ApplicationDto>(`/applications/${this.id}`);
        this.application.set(app);
        if (app.status === 'FAILED' || app.generationError) {
          this.generating.set(false);
          this.error.set(app.generationError ?? 'KI-Generierung fehlgeschlagen. Bitte versuche es erneut.');
        } else if (app.optimizedCv) {
          this.generating.set(false);
          this.populateForm(app);
        } else {
          this.schedulePoll(attempt + 1);
        }
      } catch {
        this.schedulePoll(attempt + 1);
      }
    }, POLL_INTERVAL_MS);
  }

  private clearPoll(): void {
    if (this.pollTimer !== null) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private populateForm(app: ApplicationDto): void {
    this.editorForm.patchValue({
      cvText: this.optimizedCvToText(app.optimizedCv),
      formal: app.coverLetter?.['formal'] ?? '',
      warm: app.coverLetter?.['warm'] ?? app.coverLetter?.['casual'] ?? '',
      brief: app.coverLetter?.['brief'] ?? app.coverLetter?.['concise'] ?? '',
    });

    if (app.chosenVariant === 'formal' || app.chosenVariant === 'warm' || app.chosenVariant === 'brief') {
      this.selectedLetter.set(app.chosenVariant);
    }
  }

  private async patchApplication(body: Record<string, unknown>): Promise<void> {
    if (!this.id) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const updated = await this.api.patch<ApplicationDto>(`/applications/${this.id}`, body);
      this.application.update(current => ({ ...(current ?? { id: this.id }), ...updated }));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Änderungen konnten nicht gespeichert werden.');
      throw e;
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
