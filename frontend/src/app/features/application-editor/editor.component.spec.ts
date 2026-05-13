import { HttpErrorResponse } from '@angular/common/http';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditorComponent } from './editor.component';
import { ApiService } from '../../core/api/api.service';

describe('EditorComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'patch' | 'post' | 'getBlob'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), patch: jest.fn(), post: jest.fn(), getBlob: jest.fn() };
    api.get.mockResolvedValue({
      id: 'a1',
      status: 'OPEN',
      matchScore: 88,
      optimizedCv: { sections: [{ heading: 'Erfahrung', lines: ['Stripe - 2 Jahre'] }] },
      coverLetter: { formal: 'x', warm: 'y', brief: 'z' },
      chosenVariant: 'formal',
      matchReport: { summary: 'Sehr passend', keywords: ['Angular'] },
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

  it('error signal set when load fails', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Not found' } }));
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.error()).toBe('Not found');
  });

  it('patches optimized CV on save', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.editorForm.controls.cvText.setValue('Erfahrung\nAngular Apps');
    await f.componentInstance.saveCv();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1', expect.objectContaining({ optimizedCv: expect.any(Object) }));
  });

  it('switches cover letter selection and persists chosenVariant', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    await f.componentInstance.selectLetter('warm');

    expect(f.componentInstance.selectedLetterValue()).toBe('warm');
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

    await f.componentInstance.setStatus('DONE');

    expect(f.componentInstance.application()?.status).toBe('DONE');
    expect(api.patch).toHaveBeenCalledWith('/applications/a1', { status: 'DONE' });
  });

  it('opens and confirms letter regeneration', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.openRegenConfirm();
    expect(f.componentInstance.regenConfirmOpen()).toBe(true);
    await f.componentInstance.confirmRegen();

    expect(api.post).toHaveBeenCalledWith('/applications/a1/regenerate-letter', {});
    expect(f.componentInstance.regenConfirmOpen()).toBe(false);
    expect(f.componentInstance.generating()).toBe(true);
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
});
