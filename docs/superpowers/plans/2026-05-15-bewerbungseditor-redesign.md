# Bewerbungseditor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Bewerbungseditor as a fullscreen modal dialog opened from the Dashboard, with a compact top-bar + 2-column layout (CV left, letter tabs right) and fix the progress-bar bug on "Neu generieren".

**Architecture:** A new `EditorModalComponent` wraps the existing `EditorComponent`. The editor gains an optional `appId` input (falls back to route param) and a `closeRequested` output so the modal can close it. The Dashboard replaces the "Öffnen" `routerLink` with a click that sets a `selectedAppId` signal and renders the modal. The standalone route (`/app/applications/:id`) continues to work unchanged as a fallback.

**Tech Stack:** Angular 21 (signals, standalone, OnPush), SCSS with existing design tokens, NestJS (one-line backend fix), Jest for tests.

---

## Files to create / modify

| Action | File | What changes |
|---|---|---|
| Modify | `backend/src/applications/applications.service.ts` | `regenerateLetter()` resets `generationProgress: 0` before queuing |
| Modify | `frontend/.../application-editor/editor.component.ts` | Add `appId` input, `closeRequested` output, `showAnalyse` signal, private `id` getter, remove 12 alias computeds, fix `confirmRegen()` |
| Modify | `frontend/.../application-editor/editor.component.html` | Full rewrite: top-bar + 2-column body |
| Modify | `frontend/.../application-editor/editor.component.scss` | Rewrite for new layout |
| Modify | `frontend/.../application-editor/editor.component.spec.ts` | Update mocks for new input/output |
| Create | `frontend/.../application-editor/editor-modal/editor-modal.component.ts` | Fullscreen dialog wrapper |
| Create | `frontend/.../application-editor/editor-modal/editor-modal.component.html` | Backdrop + dialog with `<lba-editor>` |
| Create | `frontend/.../application-editor/editor-modal/editor-modal.component.scss` | Fixed-position overlay styles |
| Create | `frontend/.../application-editor/editor-modal/editor-modal.component.spec.ts` | Modal open/close tests |
| Modify | `frontend/.../features/dashboard/dashboard.component.ts` | Add `selectedAppId` signal |
| Modify | `frontend/.../features/dashboard/dashboard.component.html` | Replace routerLink "Öffnen" with click, add `<lba-editor-modal>` |
| Modify | `frontend/.../shared/components/pipeline-board/pipeline-board.ts` | Add `applicationOpen` output |
| Modify | `frontend/.../shared/components/pipeline-board/pipeline-board.html` | Replace RouterLink card click with button emitting ID |

---

## Task 0 — Backend: reset generationProgress in regenerateLetter

**Files:**
- Modify: `backend/src/applications/applications.service.ts:129`

- [ ] **Step 1: Update `regenerateLetter()` to reset progress before queuing**

Replace lines 129–132 in `applications.service.ts`:

```typescript
// BEFORE:
async regenerateLetter(id: string, _userId: string) {
  await this.queue.enqueueRegenerateLetter(id);
  return { message: 'Letter regeneration queued' };
}

// AFTER:
async regenerateLetter(id: string, _userId: string) {
  await this.prisma.application.update({
    where: { id },
    data: { generationProgress: 0, generationError: null },
  });
  await this.queue.enqueueRegenerateLetter(id);
  return { message: 'Letter regeneration queued' };
}
```

- [ ] **Step 2: Run backend lint and tests**

```bash
cd backend && npm run lint && npm test
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add backend/src/applications/applications.service.ts
git commit -m "fix: reset generationProgress to 0 before regenerating letter"
```

---

## Task 1 — EditorComponent: update TypeScript

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.ts`

- [ ] **Step 1: Add `appId` input, `closeRequested` output, `showAnalyse` signal; replace `id` string with getter; fix `confirmRegen()`; remove alias computeds**

Replace the entire file with:

```typescript
import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { CvSectionEditorComponent } from '../../shared/components/cv-section-editor/cv-section-editor.component';
import type { CvSection } from '../../shared/components/cv-section-editor/cv-section-editor.component';
import { AtsPanel } from '../../shared/components/ats-panel/ats-panel';
import type { OptimizationDiffEntry } from '../../shared/components/ats-panel/ats-panel';
import { AnalyticsService } from '../../core/analytics/analytics.service';

type LetterVariant = 'formal' | 'warm' | 'brief';

interface FollowUpTemplate {
  type: 'reminder' | 'status' | 'thanks';
  label: string;
  subject: string;
  body: string;
}

interface MatchReport {
  summary?: string;
  keywords?: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
  strengths?: string[];
  risks?: string[];
}

interface ApplicationDto {
  id: string;
  status?: string;
  matchScore?: number | null;
  atsScore?: number | null;
  optimizedCv?: unknown;
  coverLetter?: Record<string, string>;
  matchReport?: MatchReport;
  optimizationDiff?: OptimizationDiffEntry[] | null;
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
  imports: [ReactiveFormsModule, RouterLink, ConfirmDeleteModal, CvSectionEditorComponent, AtsPanel],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  // When used inside the modal, appId is passed as input.
  // When used as a standalone route, it falls back to the route param.
  readonly appId = input<string | null>(null);
  readonly closeRequested = output<void>();

  private get id(): string {
    return this.appId() ?? this.route.snapshot.paramMap.get('id') ?? '';
  }

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
  readonly followUpTemplates = signal<FollowUpTemplate[] | null>(null);
  readonly followUpLoading = signal(false);
  readonly followUpError = signal<string | null>(null);
  readonly copiedType = signal<string | null>(null);
  readonly structuredCv = signal<CvSection[]>([]);
  readonly showAnalyse = signal(false);

  readonly editorForm = new FormGroup({
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
    return report.matchedKeywords?.length ? report.matchedKeywords : report.keywords?.length ? report.keywords : jobKeywords;
  });
  readonly missingKeywords = computed(() => this.matchReport().missingKeywords ?? []);
  readonly optimizationDiff = computed(() => this.application()?.optimizationDiff ?? null);
  readonly generationProgress = computed(() => this.application()?.generationProgress ?? 0);
  readonly generationError = computed(() => this.application()?.generationError ?? null);
  readonly generationFailed = computed(() => this.application()?.status === 'FAILED' || !!this.generationError());
  readonly jobTitle = computed(() => this.application()?.jobPosting?.parsedJson?.title ?? '');
  readonly jobCompany = computed(() => this.application()?.jobPosting?.parsedJson?.company ?? '');

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

  onSectionsChange(sections: CvSection[]): void {
    this.structuredCv.set(sections);
    void this.saveStructuredCv();
  }

  async saveStructuredCv(): Promise<void> {
    if (!this.id) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.api.patch<ApplicationDto>(`/applications/${this.id}/cv`, { sections: this.structuredCv() });
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Änderungen konnten nicht gespeichert werden.');
    } finally {
      this.saving.set(false);
    }
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

  async downloadCvPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/cv`, 'Lebenslauf.pdf');
  }

  async downloadLetterPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/letter`, 'Anschreiben.pdf');
  }

  async downloadBundle(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/export/bundle`, 'Bewerbung.zip');
  }

  async downloadPdf(): Promise<void> {
    await this.downloadFile(`/applications/${this.id}/pdf`, 'Lebenslauf.pdf');
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
    if (typeof window !== 'undefined') window.location.href = href;
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
    // Reset progress optimistically so the bar starts at 0, not 100
    this.application.update(app => app ? { ...app, generationProgress: 0, generationError: null } : app);
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

  async loadFollowUpTemplates(): Promise<void> {
    if (this.followUpTemplates() !== null) return;
    this.followUpLoading.set(true);
    this.followUpError.set(null);
    try {
      const templates = await this.api.get<FollowUpTemplate[]>(`/applications/${this.id}/follow-up-templates`);
      this.followUpTemplates.set(templates);
    } catch (e: unknown) {
      this.followUpError.set(e instanceof HttpErrorResponse ? e.error.message : 'Vorlagen konnten nicht geladen werden.');
    } finally {
      this.followUpLoading.set(false);
    }
  }

  async copyFollowUp(body: string, type: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(body);
      this.copiedType.set(type);
      setTimeout(() => this.copiedType.set(null), 2000);
    } catch {
      this.followUpError.set('Text konnte nicht in die Zwischenablage kopiert werden.');
    }
  }

  openFollowUpMailto(subject: string, body: string): void {
    const recipient = this.editorForm.controls.recipientEmail.value.trim();
    const href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (typeof window !== 'undefined') window.location.href = href;
  }

  private async downloadFile(path: string, filename: string): Promise<void> {
    if (!this.id) return;
    this.downloading.set(true);
    this.error.set(null);
    this.analytics.track('export-clicked');
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
    this.structuredCv.set(this.normalizeToStructured(app.optimizedCv));
    this.editorForm.patchValue({
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

  private normalizeToStructured(value: unknown): CvSection[] {
    if (!value) return [];
    if (this.isStructuredCvFormat(value)) return value.sections;
    if (this.hasOldSections(value)) {
      return value.sections.map(s => ({
        id: crypto.randomUUID(),
        heading: s.heading,
        bullets: (s.lines ?? []).map(line => ({ id: crypto.randomUUID(), text: line })),
      }));
    }
    if (this.hasExperience(value)) {
      return value.experience.map(exp => ({
        id: crypto.randomUUID(),
        heading: `${exp.role} @ ${exp.company}`,
        bullets: exp.bullets.map(b => ({
          id: crypto.randomUUID(),
          text: b.text,
          originalText: (b as { originalText?: string }).originalText,
        })),
      }));
    }
    const text = this.hasEditorText(value) ? value.text : (typeof value === 'string' ? value : '');
    if (!text) return [];
    return text
      .split(/\n{2,}/)
      .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
      .filter(lines => lines.length > 0)
      .map(([heading = '', ...lines]) => ({
        id: crypto.randomUUID(),
        heading,
        bullets: lines.map(line => ({ id: crypto.randomUUID(), text: line })),
      }));
  }

  private isStructuredCvFormat(value: unknown): value is { sections: CvSection[] } {
    if (typeof value !== 'object' || value === null) return false;
    const sections = (value as { sections?: unknown }).sections;
    return Array.isArray(sections) && (sections.length === 0 ||
      (typeof (sections[0] as { id?: unknown }).id === 'string' &&
       Array.isArray((sections[0] as { bullets?: unknown }).bullets)));
  }

  private hasOldSections(value: unknown): value is { sections: Array<{ heading: string; lines?: string[] }> } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { sections?: unknown }).sections);
  }

  private hasEditorText(value: unknown): value is { text: string } {
    return typeof value === 'object' && value !== null && 'text' in value && typeof (value as { text?: unknown }).text === 'string';
  }

  private hasExperience(value: unknown): value is {
    experience: Array<{ company: string; role: string; bullets: Array<{ text: string }> }>;
  } {
    return typeof value === 'object' && value !== null && Array.isArray((value as { experience?: unknown }).experience);
  }
}
```

- [ ] **Step 2: Run lint (template not yet changed — this just checks TS compiles)**

```bash
cd frontend && npm run lint
```
Expected: 0 errors.

---

## Task 2 — EditorComponent: new HTML template

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.html`

- [ ] **Step 1: Replace the entire template**

```html
<div class="editor" [attr.aria-busy]="loading()" id="main" tabindex="-1">

  <!-- TOP BAR -->
  <header class="editor__topbar">
    <div class="editor__topbar-title">
      <p class="editor__eyebrow">Bewerbungseditor</p>
      <h1 id="editor-title">
        {{ jobTitle() }}
        @if (jobCompany()) { · {{ jobCompany() }} }
      </h1>
    </div>

    @if (!loading() && !generating() && !generationFailed()) {
      <div class="editor__topbar-score" role="status" [attr.aria-label]="'ATS Score ' + (score() ?? 0) + ' Prozent, ' + keywords().length + ' Keywords gefunden, ' + missingKeywords().length + ' fehlen'">
        <div class="score-ring">
          <strong>{{ score() ?? 0 }}</strong>
          <span>ATS</span>
        </div>
        <div class="score-meta">
          <span>{{ keywords().length }} gefunden</span>
          <span class="score-meta--missing">{{ missingKeywords().length }} fehlen</span>
        </div>
      </div>

      <div class="editor__topbar-status" role="group" aria-label="Bewerbungsstatus">
        <button
          type="button"
          class="btn btn--sm"
          [class.btn--primary]="application()?.status === 'OPEN'"
          [class.btn--ghost]="application()?.status !== 'OPEN'"
          [attr.aria-pressed]="application()?.status === 'OPEN'"
          (click)="setStatus('OPEN')">
          Offen
        </button>
        <button
          type="button"
          class="btn btn--sm"
          [class.btn--primary]="application()?.status === 'DONE'"
          [class.btn--ghost]="application()?.status !== 'DONE'"
          [attr.aria-pressed]="application()?.status === 'DONE'"
          (click)="setStatus('DONE')">
          Erledigt
        </button>
      </div>

      <div class="editor__topbar-downloads" role="group" aria-label="Dokumente herunterladen">
        <button type="button" class="btn btn--secondary btn--sm" (click)="downloadCvPdf()" [disabled]="downloading()">CV</button>
        <button type="button" class="btn btn--secondary btn--sm" (click)="downloadLetterPdf()" [disabled]="downloading()">Anschreiben</button>
        <button type="button" class="btn btn--primary btn--sm" (click)="downloadBundle()" [disabled]="downloading()">Beide herunterladen</button>
      </div>
    }

    @if (appId()) {
      <button type="button" class="btn btn--ghost btn--sm editor__close" (click)="closeRequested.emit()" aria-label="Editor schließen">Schließen</button>
    }
  </header>

  @if (error()) {
    <p class="editor__alert" role="alert" aria-live="polite">{{ error() }}</p>
  }
  @if (message()) {
    <p class="editor__status" aria-live="polite">{{ message() }}</p>
  }

  @if (loading()) {
    <div class="editor__body editor__body--loading" aria-label="Editor wird geladen" aria-busy="true">
      <div class="skeleton skeleton--panel"></div>
      <div class="skeleton skeleton--panel"></div>
    </div>

  } @else if (generating()) {
    <div class="editor__generating" aria-live="polite" aria-busy="true" aria-label="KI generiert Bewerbungsunterlagen">
      <div class="generation-status">
        <p class="editor__generating-label">KI optimiert deinen Lebenslauf und erstellt Anschreiben...</p>
        <div class="generation-status__bar" role="progressbar" [attr.aria-valuenow]="generationProgress()" aria-valuemin="0" aria-valuemax="100">
          <span [style.width.%]="generationProgress()"></span>
        </div>
        <p>{{ generationProgress() }}% abgeschlossen</p>
      </div>
      <div class="editor__body editor__body--loading">
        <div class="skeleton skeleton--panel"></div>
        <div class="skeleton skeleton--panel"></div>
      </div>
    </div>

  } @else if (generationFailed()) {
    <div class="generation-status generation-status--failed" aria-live="assertive" aria-label="KI-Generierung fehlgeschlagen">
      <p class="editor__generating-label">Die KI-Generierung ist fehlgeschlagen.</p>
      <p>{{ generationError() ?? 'Bitte starte die Generierung erneut.' }}</p>
      <button type="button" class="btn btn--primary btn--md" (click)="retryGeneration()">Erneut versuchen</button>
    </div>

  } @else {
    <form class="editor__body" [formGroup]="editorForm">

      <!-- LEFT COLUMN: CV or Analyse -->
      <section class="editor__col editor__col--left" aria-labelledby="left-panel-title">

        @if (!showAnalyse()) {
          <div class="panel-head">
            <h2 id="left-panel-title">Optimierter Lebenslauf</h2>
            <span aria-live="polite" role="status">{{ saving() ? 'Speichert…' : 'Gespeichert' }}</span>
          </div>
          <lba-cv-section-editor
            [sections]="structuredCv()"
            [saving]="saving()"
            (sectionsChange)="onSectionsChange($event)"
          />
        } @else {
          <div class="panel-head">
            <h2 id="left-panel-title">Analyse</h2>
          </div>
          <lba-ats-panel
            [score]="score()"
            [matchReport]="matchReport()"
            [optimizationDiff]="optimizationDiff()"
          />
        }

        @if (followUpError()) {
          <div role="alert" aria-live="polite" class="follow-up-error">{{ followUpError() }}</div>
        }

        @if (followUpTemplates() !== null) {
          <section class="follow-up-panel" aria-labelledby="follow-up-title">
            <h3 id="follow-up-title">Nachfassen</h3>
            <ul class="follow-up-list" role="list">
              @for (tpl of followUpTemplates()!; track tpl.type) {
                <li class="follow-up-card">
                  <strong class="follow-up-card__label">{{ tpl.label }}</strong>
                  <p class="follow-up-card__subject">Betreff: {{ tpl.subject }}</p>
                  <p class="follow-up-card__preview">{{ tpl.body.slice(0, 80) }}…</p>
                  <div class="follow-up-card__actions">
                    <button type="button" class="btn btn--ghost btn--sm" (click)="copyFollowUp(tpl.body, tpl.type)" [attr.aria-label]="'Text kopieren: ' + tpl.label">
                      @if (copiedType() === tpl.type) { Kopiert! } @else { Kopieren }
                    </button>
                    <button type="button" class="btn btn--ghost btn--sm" (click)="openFollowUpMailto(tpl.subject, tpl.body)" [attr.aria-label]="'Per E-Mail senden: ' + tpl.label">
                      E-Mail öffnen
                    </button>
                  </div>
                </li>
              }
            </ul>
          </section>
        }

        <div class="editor__col-footer">
          <button type="button" class="btn btn--ghost btn--sm" (click)="showAnalyse.update(v => !v)">
            {{ showAnalyse() ? 'Lebenslauf anzeigen' : 'Analyse anzeigen' }}
          </button>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            (click)="loadFollowUpTemplates()"
            [disabled]="followUpLoading()"
            [hidden]="followUpTemplates() !== null">
            @if (followUpLoading()) { Wird geladen… } @else { Nachfassen }
          </button>
        </div>

      </section>

      <!-- RIGHT COLUMN: Anschreiben -->
      <section class="editor__col editor__col--right" aria-labelledby="letters-title">
        <div class="panel-head">
          <h2 id="letters-title">Anschreiben</h2>
          <button type="button" class="btn btn--ghost btn--sm" (click)="openRegenConfirm()">Neu generieren</button>
        </div>

        <div class="letter-tabs" role="tablist" aria-label="Anschreiben-Variante wählen">
          @for (variant of letterVariants; track variant) {
            <button
              type="button"
              role="tab"
              class="letter-tab"
              [class.letter-tab--active]="selectedLetter() === variant"
              [attr.aria-selected]="selectedLetter() === variant"
              [attr.aria-controls]="'letter-panel-' + variant"
              (click)="selectLetter(variant)">
              {{ variantLabel(variant) }}
            </button>
          }
        </div>

        @for (variant of letterVariants; track variant) {
          <div
            [id]="'letter-panel-' + variant"
            role="tabpanel"
            [attr.aria-labelledby]="'letter-tab-' + variant"
            [hidden]="selectedLetter() !== variant">
            <label [for]="'letter-' + variant" class="sr-only">{{ variantLabel(variant) }} Anschreiben</label>
            <textarea
              [id]="'letter-' + variant"
              [formControl]="editorForm.controls[variant]"
              rows="20"
              class="letter-textarea"
              (blur)="saveCoverLetter()"
            ></textarea>
          </div>
        }
        <p class="sr-only" id="chosen-letter-hint">Die gewählte Variante wird beim PDF-Export verwendet.</p>

        <div class="send-row">
          <label for="recipient-email" class="send-row__label">Empfänger</label>
          <input
            id="recipient-email"
            type="email"
            formControlName="recipientEmail"
            placeholder="recruiting@example.de"
            autocomplete="email"
            class="send-row__input"
          />
          <div class="send-row__actions">
            <button type="button" class="btn btn--secondary btn--sm" (click)="sendToSelf()" [disabled]="sending()">
              @if (sending()) { Wird gesendet... } @else { An mich senden }
            </button>
            <button type="button" class="btn btn--ghost btn--sm" (click)="openMailto()">In E-Mail-Programm öffnen</button>
          </div>
          <p class="send-row__hint">Anhänge können per mailto nicht automatisch gesetzt werden. Lade die PDFs herunter und hänge sie manuell an.</p>
        </div>

      </section>

    </form>
  }

</div>

<lba-confirm-delete-modal
  [open]="regenConfirmOpen()"
  title="Anschreiben neu generieren?"
  body="Alle drei Varianten werden neu erstellt. Deine manuellen Änderungen gehen verloren."
  confirmLabel="Ja, neu generieren"
  (confirmed)="confirmRegen()"
  (cancelled)="regenConfirmOpen.set(false)"
/>
```

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Expected: 0 errors.

---

## Task 3 — EditorComponent: new SCSS

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.scss`

- [ ] **Step 1: Replace the entire SCSS file**

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  color: var(--ink);
}

// ── TOP BAR ────────────────────────────────────────────────────────────────

.editor__topbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--line);
  background: var(--bg-2);
  flex-shrink: 0;
}

.editor__topbar-title {
  flex: 1;
  min-width: 0;

  h1 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.editor__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--ink-2);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.editor__topbar-score {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.score-ring {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid color-mix(in oklch, var(--accent) 40%, transparent);
  border-radius: var(--radius-full);
  background: color-mix(in oklch, var(--accent) 8%, var(--bg));
  line-height: 1;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--accent);
  }

  span {
    font-size: 0.55rem;
    color: var(--ink-3);
    font-weight: 700;
    text-transform: uppercase;
  }
}

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;
  color: var(--ink-2);

  &--missing {
    color: var(--danger);
  }
}

.editor__topbar-status,
.editor__topbar-downloads {
  display: flex;
  gap: var(--space-1);
}

.editor__close {
  margin-left: auto;
}

// ── ALERTS ─────────────────────────────────────────────────────────────────

.editor__alert {
  margin: var(--space-3) var(--space-6) 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid color-mix(in oklch, var(--danger) 35%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in oklch, var(--danger) 8%, var(--bg));
  color: var(--danger);
}

.editor__status {
  margin: var(--space-3) var(--space-6) 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid color-mix(in oklch, var(--success) 35%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in oklch, var(--success) 8%, var(--bg));
  color: var(--success);
  font-weight: 700;
}

// ── MAIN BODY ──────────────────────────────────────────────────────────────

.editor__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  overflow: hidden;

  &--loading {
    gap: var(--space-6);
    padding: var(--space-6);
    align-items: start;
  }
}

// ── COLUMNS ────────────────────────────────────────────────────────────────

.editor__col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  overflow-y: auto;

  &--left {
    border-right: 1px solid var(--line);
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
  }

  span {
    color: var(--ink-2);
    font-size: 0.8125rem;
  }
}

.editor__col-footer {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
  margin-top: auto;
  flex-shrink: 0;
}

// ── LETTER TABS ────────────────────────────────────────────────────────────

.letter-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.letter-tab {
  min-height: 40px;
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--ink);
  }

  &--active {
    border-bottom-color: var(--accent);
    color: var(--accent);
  }
}

.letter-textarea {
  width: 100%;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg);
  color: var(--ink);
  font: inherit;
  font-size: 0.9rem;
  line-height: 1.7;
  resize: vertical;
  min-height: 26rem;

  &:focus {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
}

// ── SEND ROW ───────────────────────────────────────────────────────────────

.send-row {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
  flex-shrink: 0;

  &__label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink-2);
  }

  &__input {
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--bg);
    color: var(--ink);
    font: inherit;
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  &__hint {
    margin: 0;
    color: var(--ink-3);
    font-size: 0.8125rem;
    line-height: 1.5;
  }
}

// ── GENERATING / FAILED STATES ─────────────────────────────────────────────

.editor__generating {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
}

.editor__generating-label {
  margin: 0;
  font-weight: 800;
}

.generation-status {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-2);

  p { margin: 0; color: var(--ink-2); }
}

.generation-status--failed {
  max-width: 720px;
  border-color: color-mix(in oklch, var(--danger) 40%, var(--line));
  background: color-mix(in oklch, var(--danger) 7%, var(--bg-2));
}

.generation-status__bar {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--bg);

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent);
    transition: width 0.2s ease;
  }
}

// ── FOLLOW-UP ──────────────────────────────────────────────────────────────

.follow-up-error {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: color-mix(in oklch, var(--danger) 8%, var(--bg));
  color: var(--danger);
  font-size: 0.875rem;
}

.follow-up-panel {
  h3 { margin: 0 0 var(--space-2); font-size: 0.9rem; font-weight: 700; }
}

.follow-up-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.follow-up-card {
  background: color-mix(in oklch, var(--ink) 4%, var(--bg));
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  &__label { font-size: 0.875rem; font-weight: 700; }
  &__subject { margin: 0; font-size: 0.8125rem; color: var(--ink-2); }
  &__preview { margin: 0; font-size: 0.8125rem; color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__actions { display: flex; gap: var(--space-2); margin-top: var(--space-1); }
}

// ── SKELETONS ──────────────────────────────────────────────────────────────

.skeleton {
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, var(--bg-2), var(--surface-2), var(--bg-2));
  background-size: 200% 100%;
  animation: pulse 1.2s ease-in-out infinite;
}

.skeleton--panel {
  min-height: 480px;
}

@keyframes pulse {
  from { background-position: 100% 0; }
  to   { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}

// ── RESPONSIVE ─────────────────────────────────────────────────────────────

@media (max-width: 900px) {
  .editor__body {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .editor__col--left {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .editor__topbar {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .editor__topbar,
  .editor__col {
    padding-inline: var(--space-4);
  }
}
```

- [ ] **Step 2: Run lint**

```bash
cd frontend && npm run lint
```
Expected: 0 errors.

- [ ] **Step 3: Run frontend tests (existing spec still passes)**

```bash
cd frontend && npm test -- --watchAll=false --testPathPattern=editor.component
```
Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/features/application-editor/editor.component.ts
git add frontend/src/app/features/application-editor/editor.component.html
git add frontend/src/app/features/application-editor/editor.component.scss
git commit -m "refactor: redesign EditorComponent — top-bar + 2-column layout, tab letters, fix confirmRegen progress"
```

---

## Task 4 — Create ApplicationEditorModalComponent

**Files:**
- Create: `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.ts`
- Create: `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.html`
- Create: `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.scss`
- Create: `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.spec.ts`

- [ ] **Step 1: Write the failing test first**

Create `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { EditorModalComponent } from './editor-modal.component';
import { EditorComponent } from '../editor.component';
import { ApiService } from '../../../core/api/api.service';
import { provideRouter } from '@angular/router';
import { convertToParamMap, ActivatedRoute } from '@angular/router';

describe('EditorModalComponent', () => {
  const mockApi = { get: jest.fn().mockResolvedValue({ id: 'a1', status: 'OPEN', optimizedCv: null }) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorModalComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApi },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
  });

  it('renders nothing when appId is null', () => {
    const f = TestBed.createComponent(EditorModalComponent);
    f.detectChanges();
    const backdrop = f.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('renders backdrop and dialog when appId is set', () => {
    const f = TestBed.createComponent(EditorModalComponent);
    f.componentRef.setInput('appId', 'a1');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.modal-backdrop')).not.toBeNull();
    expect(f.nativeElement.querySelector('.modal-panel')).not.toBeNull();
  });

  it('emits closed when backdrop is clicked', () => {
    const f = TestBed.createComponent(EditorModalComponent);
    f.componentRef.setInput('appId', 'a1');
    f.detectChanges();
    const closedSpy = jest.fn();
    f.componentInstance.closed.subscribe(closedSpy);
    f.nativeElement.querySelector('.modal-backdrop').click();
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('emits closed when Escape is pressed', () => {
    const f = TestBed.createComponent(EditorModalComponent);
    f.componentRef.setInput('appId', 'a1');
    f.detectChanges();
    const closedSpy = jest.fn();
    f.componentInstance.closed.subscribe(closedSpy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('removes keydown listener on destroy', () => {
    const f = TestBed.createComponent(EditorModalComponent);
    f.componentRef.setInput('appId', 'a1');
    f.detectChanges();
    f.destroy();
    const closedSpy = jest.fn();
    f.componentInstance.closed.subscribe(closedSpy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && npm test -- --watchAll=false --testPathPattern=editor-modal
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create the component TS**

Create `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.ts`:

```typescript
import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EditorComponent } from '../editor.component';

@Component({
  selector: 'lba-editor-modal',
  standalone: true,
  imports: [EditorComponent],
  templateUrl: './editor-modal.component.html',
  styleUrl: './editor-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorModalComponent implements OnInit, OnDestroy {
  readonly appId = input<string | null>(null);
  readonly closed = output<void>();

  private readonly escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  ngOnInit(): void {
    document.addEventListener('keydown', this.escHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.escHandler);
  }

  close(): void {
    this.closed.emit();
  }
}
```

- [ ] **Step 4: Create the template**

Create `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.html`:

```html
@if (appId()) {
  <div
    class="modal-backdrop"
    (click)="close()"
    aria-hidden="true">
  </div>
  <div
    class="modal-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="editor-title">
    <lba-editor [appId]="appId()!" (closeRequested)="close()" />
  </div>
}
```

- [ ] **Step 5: Create the SCSS**

Create `frontend/src/app/features/application-editor/editor-modal/editor-modal.component.scss`:

```scss
:host {
  display: contents;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  animation: fade-in 0.15s ease;
}

.modal-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 90vw;
  max-width: 1400px;
  height: 90vh;
  border-radius: var(--radius-lg);
  background: var(--bg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

@media (prefers-reduced-motion: reduce) {
  .modal-backdrop,
  .modal-panel {
    animation: none;
  }
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd frontend && npm test -- --watchAll=false --testPathPattern=editor-modal
```
Expected: all 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/features/application-editor/editor-modal/
git commit -m "feat: add ApplicationEditorModalComponent (fullscreen dialog wrapper)"
```

---

## Task 5 — Dashboard: open modal instead of navigating

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.html`

- [ ] **Step 1: Add `selectedAppId` signal and import modal in dashboard TS**

In `dashboard.component.ts`, add the import and signal:

```typescript
// Add to imports at top:
import { EditorModalComponent } from '../application-editor/editor-modal/editor-modal.component';

// In @Component imports array, add:
// EditorModalComponent

// In the class, add after existing signals:
readonly selectedAppId = signal<string | null>(null);
```

The full updated imports array in `@Component`:
```typescript
imports: [RouterLink, DatePipe, ConfirmDeleteModal, PipelineBoard, PipelineToolbar, EditorModalComponent],
```

- [ ] **Step 2: Replace "Öffnen" routerLink with click in dashboard HTML**

In `dashboard.component.html`, find the "Öffnen" link (line 172) and replace:

```html
<!-- BEFORE: -->
<a [routerLink]="['/app/applications', app.id]" class="btn btn--ghost btn--sm">Öffnen</a>

<!-- AFTER: -->
<button type="button" class="btn btn--ghost btn--sm" (click)="selectedAppId.set(app.id)" [attr.aria-label]="'Bewerbung öffnen: ' + companyName(app) + ' ' + jobTitle(app)">Öffnen</button>
```

- [ ] **Step 3: Add the modal at the bottom of dashboard HTML (before the closing tag)**

Add before `</main>` ends and the confirm-delete modal at the bottom of `dashboard.component.html`:

```html
<lba-editor-modal
  [appId]="selectedAppId()"
  (closed)="selectedAppId.set(null)"
/>
```

The file should end with:
```html
<lba-confirm-delete-modal
  [open]="deletingId() !== null"
  title="Wirklich löschen?"
  body="Diese Aktion kann nicht rückgängig gemacht werden."
  (confirmed)="confirmDelete()"
  (cancelled)="deletingId.set(null)"
/>

<lba-editor-modal
  [appId]="selectedAppId()"
  (closed)="selectedAppId.set(null)"
/>
```

- [ ] **Step 4: Run lint**

```bash
cd frontend && npm run lint
```
Expected: 0 errors.

- [ ] **Step 5: Run dashboard tests**

```bash
cd frontend && npm test -- --watchAll=false --testPathPattern=dashboard.component
```
Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/dashboard/dashboard.component.ts
git add frontend/src/app/features/dashboard/dashboard.component.html
git commit -m "feat: open application editor as fullscreen modal from dashboard"
```

---

## Task 6 — Pipeline Board: emit applicationOpen instead of navigating

**Files:**
- Modify: `frontend/src/app/shared/components/pipeline-board/pipeline-board.ts`
- Modify: `frontend/src/app/shared/components/pipeline-board/pipeline-board.html`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.html` (wire up new output)
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts` (handle new output)

- [ ] **Step 1: Add `applicationOpen` output to pipeline-board.ts**

In `pipeline-board.ts`, add the output (alongside the existing `statusChange` and `reminderChange`):

```typescript
// Add to existing outputs:
readonly applicationOpen = output<string>();
```

Also remove `RouterLink` from the imports array since it will no longer be needed (check the template first — if other links exist keep it, otherwise remove).

- [ ] **Step 2: Replace RouterLink card-click in pipeline-board.html**

In `pipeline-board.html`, find where the application card links to the editor (a `routerLink` pointing to `/app/applications/:id`) and replace with a button:

```html
<!-- BEFORE (find the card that has routerLink): -->
<a [routerLink]="['/app/applications', app.id]" class="pipeline-card__link">
  <!-- card content -->
</a>

<!-- AFTER: -->
<button
  type="button"
  class="pipeline-card__link"
  (click)="applicationOpen.emit(app.id)"
  [attr.aria-label]="'Bewerbung öffnen: ' + (app.jobPosting?.parsedJson?.title ?? '') + ' bei ' + (app.jobPosting?.parsedJson?.company ?? '')">
  <!-- card content unchanged -->
</button>
```

- [ ] **Step 3: Wire `applicationOpen` in dashboard.component.html**

In `dashboard.component.html`, update the `<lba-pipeline-board>` element to handle the new output:

```html
<!-- BEFORE: -->
<lba-pipeline-board
  [applications]="filteredApplications()"
  [highlightQuery]="pipelineFilter().query"
  (statusChange)="onStatusChange($event)"
  (reminderChange)="onReminderChange($event)"
/>

<!-- AFTER: -->
<lba-pipeline-board
  [applications]="filteredApplications()"
  [highlightQuery]="pipelineFilter().query"
  (statusChange)="onStatusChange($event)"
  (reminderChange)="onReminderChange($event)"
  (applicationOpen)="selectedAppId.set($event)"
/>
```

- [ ] **Step 4: Run lint**

```bash
cd frontend && npm run lint
```
Expected: 0 errors.

- [ ] **Step 5: Run tests for pipeline-board and dashboard**

```bash
cd frontend && npm test -- --watchAll=false --testPathPattern="pipeline-board|dashboard"
```
Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/pipeline-board/
git add frontend/src/app/features/dashboard/
git commit -m "feat: open editor modal from pipeline board"
```

---

## Task 7 — Full verification and deploy

- [ ] **Step 1: Backend lint + tests**

```bash
cd backend && npm run lint && npm test
```
Expected: exit 0.

- [ ] **Step 2: Frontend lint**

```bash
cd frontend && npm run lint
```
Expected: exit 0.

- [ ] **Step 3: All frontend tests**

```bash
cd frontend && npm test -- --watchAll=false
```
Expected: exit 0, all suites green.

- [ ] **Step 4: Frontend build**

```bash
cd frontend && npm run build
```
Expected: exit 0.

- [ ] **Step 5: Rebuild and restart Docker**

```bash
cd infra && docker compose build api worker && docker compose up -d api worker
```

- [ ] **Step 6: Manual smoke test checklist**

Open the app in a browser and verify:
1. Dashboard loads — application list visible
2. Click "Öffnen" on any application — fullscreen modal opens with dimmed backdrop
3. Modal shows top-bar (job title, ATS score, status buttons, download buttons, Schließen)
4. Left column: CV section editor, "Analyse anzeigen" and "Nachfassen" buttons at bottom
5. Right column: Formal / Freundlich / Knapp tabs, single tall textarea, send row at bottom
6. Clicking a letter tab switches the visible textarea
7. Clicking "Analyse anzeigen" replaces CV with ATS panel; button changes to "Lebenslauf anzeigen"
8. Pressing Escape closes the modal
9. Clicking backdrop closes the modal
10. Clicking "Schließen" button closes the modal
11. Pipeline Board (Kanban view) — clicking a card opens the modal
12. "Neu generieren" — progress bar starts at 0%, not 100%
