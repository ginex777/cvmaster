import { HttpErrorResponse } from '@angular/common/http';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditorComponent } from './editor.component';
import { ApiService } from '../../core/api/api.service';
import { LEGACY_OPEN_STATUS } from '../../shared/utils/status.utils';

describe('EditorComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'patch' | 'post' | 'getBlob'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), patch: jest.fn(), post: jest.fn(), getBlob: jest.fn() };
    api.get.mockResolvedValue({
      id: 'a1',
      status: LEGACY_OPEN_STATUS,
      matchScore: 88,
      optimizedCv: { sections: [{ heading: 'Erfahrung', lines: ['Stripe - 2 Jahre'] }] },
      coverLetter: { formal: 'x', warm: 'y', brief: 'z' },
      chosenVariant: 'formal',
      matchReport: { summary: 'Sehr passend', keywords: ['Angular'] },
      jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme' } },
    });
    api.patch.mockResolvedValue({ id: 'a1', matchScore: 88 });
    api.post.mockResolvedValue({ message: 'queued' });
    api.getBlob.mockResolvedValue(new Blob(['pdf']));

    await TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'a1' }) } } },
      ],
    }).compileComponents();
  });

  it('loads application by route param id on init', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    expect(api.get).toHaveBeenCalledWith('/applications/a1');
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('loads application by appId input when rendered inside a modal', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.componentRef.setInput('appId', 'modal-app');
    f.detectChanges();
    await f.whenStable();
    expect(api.get).toHaveBeenCalledWith('/applications/modal-app');
    expect(f.componentInstance.isModal()).toBe(true);
  });

  it('error signal set when load fails', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Not found' } }));
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.error()).toBe('Not found');
  });

  it('normalizes optimizedCv to structuredCv signal on load', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    const sections = f.componentInstance.structuredCv();
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].heading).toBe('Erfahrung');
  });

  it('saves structured CV sections via PATCH /cv', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    const sections = [{ id: 's1', heading: 'Profil', bullets: [{ id: 'b1', text: 'Angular' }] }];
    f.componentInstance.structuredCv.set(sections);
    await f.componentInstance.saveStructuredCv();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/cv', { sections });
  });

  it('onSectionsChange updates structuredCv and saves', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    const sections = [{ id: 's1', heading: 'Neu', bullets: [] }];
    f.componentInstance.onSectionsChange(sections);
    expect(f.componentInstance.structuredCv()).toEqual(sections);
    await f.whenStable();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/cv', { sections });
  });

  it('adds a CV section from the outline action and saves it', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    api.patch.mockClear();

    f.componentInstance.addCvSection();
    await f.whenStable();

    const sections = f.componentInstance.structuredCv();
    const added = sections.at(-1);
    expect(added?.heading).toBe('Neuer Abschnitt');
    expect(f.componentInstance.activeOutlineSectionId()).toBe(added?.id);
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/cv', { sections });
  });

  it('dispatches the shared command palette event from editor search', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    const dispatch = jest.spyOn(document, 'dispatchEvent');

    f.componentInstance.openCommandPalette();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'lba-command-palette-open' }));
    dispatch.mockRestore();
  });

  it('toggles the editor notifications popover', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.toggleEditorNotifications();
    f.detectChanges();

    expect(f.componentInstance.editorNotificationsOpen()).toBe(true);
    expect(f.nativeElement.querySelector('.editor__notifications')).not.toBeNull();
  });

  it('switches cover letter selection and persists chosenVariant', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.selectLetter('warm');

    expect(f.componentInstance.selectedLetter()).toBe('warm');
    expect(api.patch).toHaveBeenCalledWith('/applications/a1', { chosenVariant: 'warm' });
  });

  it('saves cover letter variants', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    await f.componentInstance.selectLetter('brief');
    f.componentInstance.letterControl().setValue('Kurzfassung');
    await f.componentInstance.saveCoverLetter();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1', {
      coverLetter: { formal: 'x', warm: 'y', brief: 'Kurzfassung' },
    });
  });

  it('optimistically sets status and persists it', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.setStatus('INTERVIEW');

    expect(f.componentInstance.application()?.status).toBe('INTERVIEW');
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/status', { status: 'INTERVIEW' });
  });

  it('opens the five-stage status menu from the header strip', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();

    const button = f.nativeElement.querySelector('.editor__status-btn') as HTMLButtonElement | null;
    button?.click();
    f.detectChanges();

    const statusItems = Array.from(
      f.nativeElement.querySelectorAll('.editor__status-menu-item[role="menuitemradio"]'),
    ) as HTMLElement[];
    const reminderItem = f.nativeElement.querySelector('.editor__status-menu-item--reminder') as HTMLElement | null;

    expect(statusItems).toHaveLength(5);
    expect(statusItems.map(item => item.textContent?.trim())).toEqual(
      expect.arrayContaining(['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgesagt']),
    );
    expect(reminderItem?.textContent).toContain('Erinnerung setzen');
  });

  it('maps APPLIED to the current backend status while keeping the five-stage display', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.setStatus('APPLIED');

    expect(f.componentInstance.application()?.status).toBe('SENT');
    expect(f.componentInstance.displayStatus()).toBe('APPLIED');
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/status', { status: 'SENT' });
  });

  it('opens a reminder picker from the status menu and shows the current reminder', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.application.update(app => app ? { ...app, reminderAt: '2026-05-20T08:30:00.000Z' } : app);

    f.componentInstance.openReminderPickerFromStatusMenu();
    f.detectChanges();

    const popover = f.nativeElement.querySelector('.editor__reminder-popover') as HTMLElement | null;
    const current = f.nativeElement.querySelector('.editor__reminder-current') as HTMLElement | null;
    expect(popover).not.toBeNull();
    expect(current?.textContent).toContain('Aktuell');
    expect(f.componentInstance.reminderDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sets and clears reminders through the reminder endpoint', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.setReminder('2026-05-20T08:30:00.000Z');
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/reminder', { reminderAt: '2026-05-20T08:30:00.000Z' });
    expect(f.componentInstance.application()?.reminderAt).toBe('2026-05-20T08:30:00.000Z');

    await f.componentInstance.clearReminder();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1/reminder', { reminderAt: null });
    expect(f.componentInstance.application()?.reminderAt).toBeNull();
  });

  it('renders ATS score quality text in the header widget', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();

    const scoreRing = f.nativeElement.querySelector('lba-score-ring .score-ring') as HTMLElement | null;
    const scoreSub = f.nativeElement.querySelector('.editor__score-sub') as HTMLElement | null;

    expect(scoreRing?.style.width).toBe('42px');
    expect(scoreSub?.textContent?.trim()).toBe('Stark · 1/1 Keywords');
    expect(scoreSub?.getAttribute('data-tone')).toBe('good');
  });

  it('opens and confirms letter regeneration', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.application.update(app => app ? { ...app, generationProgress: 100, generationError: 'Alt' } : app);

    f.componentInstance.openRegenConfirm();
    expect(f.componentInstance.regenConfirmOpen()).toBe(true);
    await f.componentInstance.confirmRegen();

    expect(api.post).toHaveBeenCalledWith('/applications/a1/regenerate-letter', {});
    expect(f.componentInstance.regenConfirmOpen()).toBe(false);
    expect(f.componentInstance.generating()).toBe(true);
    expect(f.componentInstance.generationProgress()).toBe(0);
    expect(f.componentInstance.generationError()).toBeNull();
  });

  it('shows failed generation state and retries full generation', async () => {
    api.get.mockResolvedValueOnce({
      id: 'a1',
      status: 'FAILED',
      generationProgress: 50,
      generationError: 'Die KI-Generierung ist fehlgeschlagen. Bitte versuche es erneut.',
    });
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.generationFailed()).toBe(true);
    expect(f.componentInstance.error()).toContain('fehlgeschlagen');

    await f.componentInstance.retryGeneration();

    expect(api.post).toHaveBeenCalledWith('/applications/a1/retry-generation', {});
    expect(f.componentInstance.generating()).toBe(true);
  });

  it('downloads PDF from application endpoint', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    const createObjectUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    const click = jest.fn();
    const anchor = document.createElement('a');
    Object.defineProperty(anchor, 'click', { value: click });
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(anchor);

    await f.componentInstance.downloadPdf();

    expect(api.getBlob).toHaveBeenCalledWith('/applications/a1/pdf');
    expect(anchor.download).toBe('Lebenslauf.pdf');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');

    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
    createElement.mockRestore();
  });

  it('downloads the export bundle from the bundle endpoint', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    const anchor = document.createElement('a');
    Object.defineProperty(anchor, 'click', { value: jest.fn() });
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(anchor);

    await f.componentInstance.downloadBundle();

    expect(api.getBlob).toHaveBeenCalledWith('/applications/a1/export/bundle');
    expect(anchor.download).toBe('Bewerbung.zip');

    createElement.mockRestore();
  });

  it('opens the export dropdown with all export actions', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();

    const button = f.nativeElement.querySelector('.editor__export-btn') as HTMLButtonElement | null;
    button?.click();
    f.detectChanges();

    const items = Array.from(f.nativeElement.querySelectorAll('.editor__export-menu-item')) as HTMLElement[];
    expect(items).toHaveLength(4);
    expect(items.map(item => item.textContent?.trim())).toEqual(
      expect.arrayContaining([
        'Beide herunterladen (ZIP)',
        'Lebenslauf als PDF',
        'Anschreiben als PDF',
        'Per E-Mail senden...',
      ]),
    );
  });

  it('focuses the send footer recipient input from the export menu', async () => {
    jest.useFakeTimers();
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.rightTab.set('analyse');
    f.detectChanges();

    f.componentInstance.focusRecipientInputFromExportMenu();
    f.detectChanges();
    jest.runOnlyPendingTimers();

    expect(document.activeElement?.id).toBe('recipient-email');
    jest.useRealTimers();
  });

  it('shows the selected letter variant in the send footer', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    await f.componentInstance.selectLetter('warm');
    f.detectChanges();

    const tag = f.nativeElement.querySelector('.send-row__variant-tag') as HTMLElement | null;
    expect(tag?.textContent?.trim()).toBe('Warm-Variante');
  });

  it('sends generated documents to the user email address', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.sendToSelf();

    expect(api.post).toHaveBeenCalledWith('/applications/a1/email-to-self', {});
    expect(f.componentInstance.message()).toContain('E-Mail-Adresse');
    expect(f.componentInstance.sending()).toBe(false);
  });

  it('shows a user-facing error when email-to-self fails', async () => {
    api.post.mockRejectedValueOnce(new HttpErrorResponse({ error: { message: 'Mail nicht erreichbar' } }));
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.sendToSelf();

    expect(f.componentInstance.error()).toBe('Mail nicht erreichbar');
    expect(f.componentInstance.message()).toBeNull();
  });

  it('builds mailto link from recipient, job title, and selected letter', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.editorForm.controls.recipientEmail.setValue('jobs@example.de');

    const href = f.componentInstance.mailtoHref();

    expect(href).toContain('mailto:jobs%40example.de');
    expect(href).toContain('Bewerbung%20als%20Frontend%20Developer');
    expect(decodeURIComponent(href)).toContain('Bitte füge die heruntergeladenen PDF-Dateien');
  });

  describe('follow-up templates', () => {
    const mockTemplates = [
      { type: 'reminder', label: 'Erinnerung', subject: 'Nachfrage', body: 'Sehr geehrte...' },
      { type: 'status', label: 'Status-Anfrage', subject: 'Statusanfrage', body: 'Ich beziehe mich...' },
      { type: 'thanks', label: 'Dankesnachricht', subject: 'Vielen Dank', body: 'Vielen Dank...' },
    ];

    it('followUpTemplates is null initially', async () => {
      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      await f.whenStable();
      expect(f.componentInstance.followUpTemplates()).toBeNull();
    });

    it('loads templates and sets signal on success', async () => {
      api.get
        .mockResolvedValueOnce({ id: 'a1', status: LEGACY_OPEN_STATUS, matchScore: 88, optimizedCv: { text: 'cv' }, coverLetter: {}, chosenVariant: 'formal', jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } })
        .mockResolvedValueOnce(mockTemplates);
      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      await f.whenStable();

      await f.componentInstance.loadFollowUpTemplates();

      expect(api.get).toHaveBeenCalledWith('/applications/a1/follow-up-templates');
      expect(f.componentInstance.followUpTemplates()).toEqual(mockTemplates);
    });

    it('does not reload if templates already loaded', async () => {
      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      await f.whenStable();
      f.componentInstance.followUpTemplates.set(mockTemplates as never);

      await f.componentInstance.loadFollowUpTemplates();

      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('sets followUpError on load failure', async () => {
      api.get
        .mockResolvedValueOnce({ id: 'a1', status: LEGACY_OPEN_STATUS, matchScore: 88, optimizedCv: { text: 'cv' }, coverLetter: {}, chosenVariant: 'formal', jobPosting: {} })
        .mockRejectedValueOnce(new HttpErrorResponse({ error: { message: 'Fehler' } }));
      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      await f.whenStable();

      await f.componentInstance.loadFollowUpTemplates();

      expect(f.componentInstance.followUpError()).toBe('Fehler');
    });

    it('copiedType is set after copyFollowUp and cleared after 2s', async () => {
      jest.useFakeTimers();
      Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });

      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      await f.whenStable();

      const p = f.componentInstance.copyFollowUp('Text', 'reminder');
      await p;

      expect(f.componentInstance.copiedType()).toBe('reminder');
      jest.advanceTimersByTime(2000);
      expect(f.componentInstance.copiedType()).toBeNull();
      jest.useRealTimers();
    });
  });
});
