import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MasterCvsComponent } from './master-cvs.component';
import { ApiService } from '../../core/api/api.service';

describe('MasterCvsComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'upload' | 'delete' | 'patch' | 'post'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), upload: jest.fn(), delete: jest.fn(), patch: jest.fn(), post: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [MasterCvsComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('loading is true on init, false after CVs load', async () => {
    let resolve!: (v: unknown) => void;
    api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve([]);
    await fixture.whenStable();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('cvs signal is populated after successful load', async () => {
    const data = [{ id: 'cv1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(data);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.cvs()).toHaveLength(1);
    expect(fixture.componentInstance.cvs()[0].id).toBe('cv1');
  });

  it('error signal is set when list API throws HttpErrorResponse', async () => {
    api.get.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Fehler' } }),
    );
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Fehler');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('error signal is set to fallback for non-HTTP errors', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Lebensläufe konnten nicht geladen werden.');
  });

  it('upload input accepts .pdf and .docx', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type=file]');
    expect(input?.getAttribute('accept')).toContain('.pdf');
    expect(input?.getAttribute('accept')).toContain('.docx');
  });

  it('aria-live error region is rendered when error signal is set', async () => {
    api.get.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Serverfehler' } }),
    );
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role=alert]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Serverfehler');
  });

  it('upload prepends new CV to the list on success', async () => {
    api.get.mockResolvedValue([]);
    const newCv = { id: 'cv2', name: 'New CV', language: 'de', sourceFilename: 'new.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' };
    api.upload.mockResolvedValue(newCv);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const file = new File(['%PDF-'], 'new.pdf', { type: 'application/pdf' });
    const input = fixture.nativeElement.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.cvs()).toHaveLength(1);
    expect(fixture.componentInstance.cvs()[0].id).toBe('cv2');
  });

  it('shows a text CV form when requested', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.toggleTextForm();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#text-cv-panel')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#text-cv-text')).toBeTruthy();
  });

  it('posts pasted CV text and prepends the saved CV', async () => {
    api.get.mockResolvedValue([]);
    const newCv = { id: 'cv-text', name: 'Text CV', language: 'de', sourceFilename: 'text-input', template: 'modern' as const, createdAt: '2026-05-15T00:00:00.000Z', updatedAt: '2026-05-15T00:00:00.000Z' };
    api.post.mockResolvedValue(newCv);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.componentInstance.textCvForm.setValue({
      name: 'Text CV',
      language: 'de',
      text: 'Lina Beispiel arbeitet mit Angular, TypeScript, Testing und barrierearmen Web-Oberflaechen.',
    });

    await fixture.componentInstance.createFromText();

    expect(api.post).toHaveBeenCalledWith('/cvs/text', {
      name: 'Text CV',
      language: 'de',
      text: 'Lina Beispiel arbeitet mit Angular, TypeScript, Testing und barrierearmen Web-Oberflaechen.',
    });
    expect(fixture.componentInstance.cvs()[0].id).toBe('cv-text');
    expect(fixture.componentInstance.textFormOpen()).toBe(false);
  });

  it('validates pasted CV text before calling the API', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.componentInstance.textCvForm.setValue({ name: 'A', language: 'de', text: 'zu kurz' });

    await fixture.componentInstance.createFromText();

    expect(api.post).not.toHaveBeenCalled();
    expect(fixture.componentInstance.textCvForm.touched).toBe(true);
  });

  it('renders a friendly source label for pasted CVs', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    const cv = { id: 'cv-text', name: 'CV', language: 'de', sourceFilename: 'text-input', template: 'modern' as const, createdAt: '', updatedAt: '' };

    expect(fixture.componentInstance.sourceLabel(cv)).toBe('Text-Eingabe');
  });

  it('requestDelete stores the pending CV id', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.componentInstance.requestDelete('cv1');

    expect(fixture.componentInstance.deletingId()).toBe('cv1');
  });

  it('confirmDelete deletes a CV from the list and closes the modal', async () => {
    const cvList = [{ id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(cvList);
    api.delete.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.requestDelete('cv1');

    await fixture.componentInstance.confirmDelete();

    expect(fixture.componentInstance.cvs()).toHaveLength(0);
    expect(fixture.componentInstance.deletingId()).toBeNull();
  });

  it('useInWizard navigates to wizard with the selected CV id', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.useInWizard('cv1');

    expect(navigate).toHaveBeenCalledWith(['/app/wizard'], { queryParams: { cvId: 'cv1' } });
  });

  it('startRename fills the inline rename state', async () => {
    api.get.mockResolvedValue([]);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    const cv = { id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '', updatedAt: '' };

    fixture.componentInstance.startRename(cv);

    expect(fixture.componentInstance.renamingId()).toBe('cv1');
    expect(fixture.componentInstance.renameValue()).toBe('CV');
  });

  it('saveRename patches the API and updates the list', async () => {
    api.get.mockResolvedValue([]);
    api.patch.mockResolvedValue({} as never);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    const cv = { id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '', updatedAt: '' };
    fixture.componentInstance.cvs.set([cv]);
    fixture.componentInstance.startRename(cv);
    fixture.componentInstance.renameValue.set('Updated CV');

    await fixture.componentInstance.saveRename(cv);

    expect(api.patch).toHaveBeenCalledWith('/cvs/cv1', { name: 'Updated CV' });
    expect(fixture.componentInstance.cvs()[0].name).toBe('Updated CV');
    expect(fixture.componentInstance.renamingId()).toBeNull();
  });

  it('updateTemplate optimistically updates and persists the template', async () => {
    api.get.mockResolvedValue([]);
    api.patch.mockResolvedValue({} as never);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.componentInstance.cvs.set([
      { id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern', createdAt: '', updatedAt: '' },
    ]);

    const promise = fixture.componentInstance.updateTemplate('cv1', 'classic');

    expect(fixture.componentInstance.cvs()[0].template).toBe('classic');
    await promise;
    expect(api.patch).toHaveBeenCalledWith('/cvs/cv1', { template: 'classic' });
  });

  it('updateTemplate rolls back and sets error when persistence fails', async () => {
    api.get.mockResolvedValue([]);
    api.patch.mockRejectedValue(new HttpErrorResponse({ status: 500 }));
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.componentInstance.cvs.set([
      { id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern', createdAt: '', updatedAt: '' },
    ]);

    await fixture.componentInstance.updateTemplate('cv1', 'editorial');

    expect(fixture.componentInstance.cvs()[0].template).toBe('modern');
    expect(fixture.componentInstance.error()).toBe('Template konnte nicht gespeichert werden.');
  });

  it('renders CV name in card-title after load', async () => {
    const data = [{ id: 'cv1', name: 'Mein Lebenslauf', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(data);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.cv-card__title') as HTMLElement;
    expect(title?.textContent?.trim()).toBe('Mein Lebenslauf');
  });

  it('use-in-wizard button has correct aria-label', async () => {
    const data = [{ id: 'cv1', name: 'Mein CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern' as const, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(data);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[aria-label="In Bewerbung anwenden: Mein CV"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
  });
});
