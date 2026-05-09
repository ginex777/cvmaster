import { HttpErrorResponse } from '@angular/common/http';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditorComponent } from './editor.component';
import { ApiService } from '../../core/api/api.service';

describe('EditorComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'patch' | 'getBlob'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), patch: jest.fn(), getBlob: jest.fn() };
    api.get.mockResolvedValue({
      id: 'a1',
      matchScore: 88,
      optimizedCv: { sections: [{ heading: 'Erfahrung', lines: ['Stripe - 2 Jahre'] }] },
      coverLetter: { formal: 'x', warm: 'y', brief: 'z' },
      matchReport: { summary: 'Sehr passend', keywords: ['Angular'] },
    });
    api.patch.mockResolvedValue({ id: 'a1', matchScore: 88 });
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

  it('switches cover letter tab and saves variants', async () => {
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.selectedLetter.set('brief');
    f.componentInstance.letterControl().setValue('Kurzfassung');
    await f.componentInstance.saveCoverLetter();
    expect(api.patch).toHaveBeenCalledWith('/applications/a1', {
      coverLetter: { formal: 'x', warm: 'y', brief: 'Kurzfassung' },
    });
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
});
