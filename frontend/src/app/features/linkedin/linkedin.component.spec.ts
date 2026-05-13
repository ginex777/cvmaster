import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LinkedInComponent } from './linkedin.component';
import { ApiService } from '../../core/api/api.service';

const mockResult = {
  headline: 'Senior Frontend Developer | Angular',
  about: 'Experienced developer with a passion for clean code.',
  experience: [
    { role: 'Frontend Dev', company: 'Acme', improvedBullets: ['Led migration', 'Improved performance'] },
  ],
};

describe('LinkedInComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  beforeEach(async () => {
    api = { post: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [LinkedInComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('result is null initially', () => {
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.result()).toBeNull();
  });

  it('loading is true during optimization, false after', async () => {
    let resolve!: (v: unknown) => void;
    api.post.mockReturnValue(new Promise(r => { resolve = r; }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    const p = f.componentInstance.optimize();
    expect(f.componentInstance.loading()).toBe(true);
    resolve(mockResult);
    await p;
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('sets result on success', async () => {
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Frontend Developer' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.result()).toEqual(mockResult);
    expect(f.componentInstance.error()).toBeNull();
  });

  it('sets PRO-upgrade error on 403 response', async () => {
    api.post.mockRejectedValue(new HttpErrorResponse({ status: 403, error: { message: 'Plan upgrade required' } }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.error()).toContain('PRO');
  });

  it('sets error on API failure', async () => {
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'AI timeout' } }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.error()).toBe('AI timeout');
  });

  it('calls POST /linkedin/optimize with profileText and targetRole', async () => {
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    const profileText = 'x'.repeat(60);
    f.componentInstance.form.setValue({ profileText, targetRole: 'Senior Dev' });
    await f.componentInstance.optimize();
    expect(api.post).toHaveBeenCalledWith('/linkedin/optimize', { profileText, targetRole: 'Senior Dev' });
  });

  it('copiedField set after copyField and cleared after 2s', async () => {
    jest.useFakeTimers();
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    const f = TestBed.createComponent(LinkedInComponent);
    await f.componentInstance.copyField('some text', 'headline');
    expect(f.componentInstance.copiedField()).toBe('headline');
    jest.advanceTimersByTime(2000);
    expect(f.componentInstance.copiedField()).toBeNull();
    jest.useRealTimers();
  });
});
