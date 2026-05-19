import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, output, signal, viewChild } from '@angular/core';
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
import { IconsModule } from '../../shared/icons/icons.module';
import { ScoreRingComponent } from '../../shared/components/score-ring.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill';
import { UpgradeModal } from '../../shared/components/upgrade-modal/upgrade-modal';
import { legacyToStatus, STATUS_META, STATUS_ORDER, type ApplicationStatus } from '../../shared/utils/status.utils';

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
  reminderAt?: string | null;
  jobPosting?: { parsedJson?: { title?: string; company?: string; keywords?: string[] } };
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

@Component({
  selector: 'lba-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDeleteModal, CvSectionEditorComponent, AtsPanel, IconsModule, ScoreRingComponent, StatusPillComponent, UpgradeModal],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss', './print.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly recipientEmailInput = viewChild<ElementRef<HTMLInputElement>>('recipientEmailInput');
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

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
  readonly rightTab = signal<'letter' | 'analyse' | 'followup'>('letter');
  readonly activeOutlineSectionId = signal<string | null>(null);
  readonly statusMenuOpen = signal(false);
  readonly exportMenuOpen = signal(false);
  readonly editorNotificationsOpen = signal(false);
  readonly upgradeModalOpen = signal(false);
  readonly reminderPopoverOpen = signal(false);
  readonly reminderDate = signal('');
  readonly reminderTime = signal('09:00');
  readonly statusOptions = STATUS_ORDER;

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
  readonly isModal = computed(() => {
    const appId = this.appId();
    return appId !== null && this.route.snapshot.paramMap.get('id') !== appId;
  });
  readonly reminderAt = computed(() => this.application()?.reminderAt ?? null);
  readonly reminderLabel = computed(() => {
    const reminderAt = this.reminderAt();
    if (!reminderAt) return 'Keine Erinnerung gesetzt';
    const date = new Date(reminderAt);
    if (Number.isNaN(date.getTime())) return 'Erinnerung gesetzt';
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  });
  readonly jobTitle = computed(() => this.application()?.jobPosting?.parsedJson?.title ?? '');
  readonly jobCompany = computed(() => this.application()?.jobPosting?.parsedJson?.company ?? '');
  readonly matchQualityText = computed(() => {
    const score = this.score() ?? 0;
    const quality = score >= 80 ? 'Stark' : score >= 60 ? 'Solide' : 'Ausbaufähig';
    const matched = this.keywords().length;
    const total = matched + this.missingKeywords().length;
    return `${quality} · ${matched}/${total || matched} Keywords`;
  });
  readonly matchQualityTone = computed<'good' | 'neutral' | 'warn'>(() => {
    const score = this.score() ?? 0;
    if (score >= 80) return 'good';
    if (score >= 60) return 'neutral';
    return 'warn';
  });

  readonly companyInitials = computed(() =>
    this.jobCompany().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'HF',
  );

  isVariantLocked(variant: LetterVariant): boolean {
    void variant;
    return false;
  }

  readonly displayStatus = computed((): ApplicationStatus => {
    const s = this.application()?.status;
    return s ? legacyToStatus(s, true) : 'DRAFT';
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  ngOnDestroy(): void {
    this.clearPoll();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node)) return;

    const statusSelect = this.host.nativeElement.querySelector('.editor__status-select');
    if ((this.statusMenuOpen() || this.reminderPopoverOpen()) && !statusSelect?.contains(target)) {
      this.closeStatusOverlays();
    }

    if (this.exportMenuOpen() && !this.host.nativeElement.querySelector('.editor__export-select')?.contains(target)) {
      this.exportMenuOpen.set(false);
    }

    const notificationButton = this.host.nativeElement.querySelector('.editor__topbar-icon');
    const notificationsPanel = this.host.nativeElement.querySelector('.editor__notifications');
    if (this.editorNotificationsOpen() && !notificationButton?.contains(target) && !notificationsPanel?.contains(target)) {
      this.editorNotificationsOpen.set(false);
    }
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

  addCvSection(): void {
    const section: CvSection = { id: crypto.randomUUID(), heading: 'Neuer Abschnitt', bullets: [] };
    this.structuredCv.update(sections => [...sections, section]);
    this.activeOutlineSectionId.set(section.id);
    void this.saveStructuredCv();
  }

  openCommandPalette(): void {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new Event('lba-command-palette-open'));
  }

  toggleEditorNotifications(): void {
    this.editorNotificationsOpen.update(open => !open);
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

  toggleStatusMenu(): void {
    this.statusMenuOpen.update(open => !open);
  }

  closeStatusMenu(): void {
    this.statusMenuOpen.set(false);
  }

  closeStatusOverlays(): void {
    this.statusMenuOpen.set(false);
    this.reminderPopoverOpen.set(false);
  }

  toggleExportMenu(): void {
    this.exportMenuOpen.update(open => !open);
  }

  closeExportMenu(): void {
    this.exportMenuOpen.set(false);
  }

  statusMeta(status: ApplicationStatus): typeof STATUS_META[ApplicationStatus] {
    return STATUS_META[status];
  }

  async chooseStatus(status: ApplicationStatus): Promise<void> {
    if (this.displayStatus() !== status) {
      await this.setStatus(status);
    }
    this.closeStatusMenu();
  }

  openReminderPickerFromStatusMenu(): void {
    this.closeStatusMenu();
    this.populateReminderInputs();
    this.reminderPopoverOpen.set(true);
  }

  closeReminderPopover(): void {
    this.reminderPopoverOpen.set(false);
  }

  onReminderDateInput(event: Event): void {
    this.reminderDate.set((event.target as HTMLInputElement).value);
  }

  onReminderTimeInput(event: Event): void {
    this.reminderTime.set((event.target as HTMLInputElement).value);
  }

  async applyReminder(): Promise<void> {
    const date = this.reminderDate();
    const time = this.reminderTime() || '09:00';
    if (!date) {
      this.error.set('Bitte wähle ein Datum für die Erinnerung.');
      return;
    }

    const reminder = new Date(`${date}T${time}`);
    if (Number.isNaN(reminder.getTime())) {
      this.error.set('Erinnerung konnte nicht gelesen werden.');
      return;
    }

    await this.setReminder(reminder.toISOString());
    this.closeReminderPopover();
  }

  async clearReminder(): Promise<void> {
    await this.setReminder(null);
    this.reminderDate.set('');
    this.reminderTime.set('09:00');
    this.closeReminderPopover();
  }

  async downloadBundleFromMenu(): Promise<void> {
    this.closeExportMenu();
    await this.downloadBundle();
  }

  async downloadCvPdfFromMenu(): Promise<void> {
    this.closeExportMenu();
    await this.downloadCvPdf();
  }

  async downloadLetterPdfFromMenu(): Promise<void> {
    this.closeExportMenu();
    await this.downloadLetterPdf();
  }

  focusRecipientInputFromExportMenu(): void {
    this.closeExportMenu();
    this.rightTab.set('letter');
    setTimeout(() => this.recipientEmailInput()?.nativeElement.focus(), 0);
  }

  async setStatus(status: ApplicationStatus): Promise<void> {
    if (!this.id) return;
    const previous = this.application();
    const apiStatus = this.statusToApiStatus(status);
    this.application.update(app => app ? { ...app, status: apiStatus } : app);

    try {
      const updated = await this.api.patch<ApplicationDto>(`/applications/${this.id}/status`, { status: apiStatus });
      this.application.update(current => ({ ...(current ?? { id: this.id }), ...updated }));
    } catch (e: unknown) {
      this.application.set(previous);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Status konnte nicht geändert werden.');
    }
  }

  async setReminder(reminderAt: string | null): Promise<void> {
    if (!this.id) return;
    const previous = this.application();
    this.application.update(app => app ? { ...app, reminderAt } : app);
    this.saving.set(true);
    this.error.set(null);

    try {
      const updated = await this.api.patch<ApplicationDto>(`/applications/${this.id}/reminder`, { reminderAt });
      this.application.update(current => ({ ...(current ?? { id: this.id }), ...updated }));
    } catch (e: unknown) {
      this.application.set(previous);
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Erinnerung konnte nicht gespeichert werden.');
    } finally {
      this.saving.set(false);
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
      'Hinweis: Bitte füge die heruntergeladenen PDF-Dateien als Anhang hinzu.',
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
    return { formal: 'Formal', warm: 'Warm', brief: 'Kurz' }[variant];
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
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
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

  private statusToApiStatus(status: ApplicationStatus): string {
    return status === 'APPLIED' ? 'SENT' : status;
  }

  private populateReminderInputs(): void {
    const reminderAt = this.reminderAt();
    if (!reminderAt) {
      this.reminderDate.set('');
      this.reminderTime.set('09:00');
      return;
    }

    const date = new Date(reminderAt);
    if (Number.isNaN(date.getTime())) return;
    this.reminderDate.set(this.toDateInputValue(date));
    this.reminderTime.set(this.toTimeInputValue(date));
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimeInputValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

    // New stable format: sections array with id + bullets array with id
    if (this.isStructuredCvFormat(value)) return value.sections;

    // Old sections format: { sections: [{ heading, lines: string[] }] }
    if (this.hasOldSections(value)) {
      return value.sections.map(s => ({
        id: crypto.randomUUID(),
        heading: s.heading,
        bullets: (s.lines ?? []).map(line => ({ id: crypto.randomUUID(), text: line })),
      }));
    }

    // Experience format: { experience: [{role, company, bullets: [{text, originalText?}]}] }
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

    // Text format: { text: string } or plain string
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
