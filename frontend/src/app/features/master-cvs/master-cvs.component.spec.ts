import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MasterCvsComponent } from './master-cvs.component';
import { ApiService } from '../../core/api/api.service';

describe('MasterCvsComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'upload' | 'delete'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), upload: jest.fn(), delete: jest.fn() };
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
    const data = [{ id: 'cv1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
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
    const newCv = { id: 'cv2', name: 'New CV', language: 'de', sourceFilename: 'new.pdf', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' };
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

  it('remove deletes a CV from the list', async () => {
    const cvList = [{ id: 'cv1', name: 'CV', language: 'de', sourceFilename: 'cv.pdf', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(cvList);
    api.delete.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(MasterCvsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.remove('cv1');

    expect(fixture.componentInstance.cvs()).toHaveLength(0);
  });
});
