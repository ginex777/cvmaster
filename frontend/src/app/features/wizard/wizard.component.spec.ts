import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { WizardComponent } from './wizard.component';
import { ApiService } from '../../core/api/api.service';

describe('WizardComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'post'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), post: jest.fn() };
    api.get.mockResolvedValue([]);
    await TestBed.configureTestingModule({
      imports: [WizardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('starts on step 1 (CV selection)', () => {
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    expect(f.componentInstance.step()).toBe(1);
  });

  it('advances to step 2 when CV is selected', () => {
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    f.componentInstance.selectCv('cv1');
    expect(f.componentInstance.step()).toBe(2);
  });

  it('selectedCvId is set when a CV is selected', () => {
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    f.componentInstance.selectCv('cv1');
    expect(f.componentInstance.selectedCvId()).toBe('cv1');
  });

  it('cvs signal is populated after successful load', async () => {
    const cvList = [{ id: 'cv1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
    api.get.mockResolvedValue(cvList);
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.cvs()).toHaveLength(1);
    expect(f.componentInstance.cvs()[0].id).toBe('cv1');
  });

  it('error signal set when generate API throws HttpErrorResponse', async () => {
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' } }));
    const f = TestBed.createComponent(WizardComponent);
    f.componentInstance.selectedCvId.set('cv1');
    f.componentInstance.jobForm.setValue({ jobRaw: 'Frontend Developer at Stripe with React skills required for this position...' });
    await f.componentInstance.generate();
    expect(f.componentInstance.error()).toBe('Fehler');
  });

  it('shows upgrade modal when application creation returns 402', async () => {
    api.post.mockImplementation((path: string) => {
      if (path === '/jobs/parse') return Promise.resolve({ id: 'job1' });
      return Promise.reject(new HttpErrorResponse({ status: 402, error: { message: 'Plan limit' } }));
    });
    const f = TestBed.createComponent(WizardComponent);
    f.componentInstance.selectedCvId.set('cv1');
    f.componentInstance.jobForm.setValue({ jobRaw: 'Frontend Developer at Stripe with React skills required for this position...' });

    await f.componentInstance.generate();

    expect(f.componentInstance.upgradeModalOpen()).toBe(true);
    expect(f.componentInstance.error()).toBeNull();
  });

  it('error signal set to fallback for non-HTTP errors', async () => {
    api.post.mockRejectedValue(new Error('network'));
    const f = TestBed.createComponent(WizardComponent);
    f.componentInstance.selectedCvId.set('cv1');
    f.componentInstance.jobForm.setValue({ jobRaw: 'Frontend Developer at Stripe with React skills required for this position...' });
    await f.componentInstance.generate();
    expect(f.componentInstance.error()).toBe('Bewerbung konnte nicht erstellt werden.');
  });

  it('loading is false after generate completes', async () => {
    api.post.mockRejectedValue(new Error('fail'));
    const f = TestBed.createComponent(WizardComponent);
    f.componentInstance.selectedCvId.set('cv1');
    f.componentInstance.jobForm.setValue({ jobRaw: 'Frontend Developer at Stripe with React skills required for this position...' });
    await f.componentInstance.generate();
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('step 2 form shows textarea with job posting field', async () => {
    api.get.mockResolvedValue([{ id: 'cv1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }]);
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.selectCv('cv1');
    f.detectChanges();
    const textarea = f.nativeElement.querySelector('textarea');
    expect(textarea).toBeTruthy();
  });
});
