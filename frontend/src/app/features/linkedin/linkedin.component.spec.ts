import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LinkedInComponent } from './linkedin.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { UpgradeService } from '../../shared/services/upgrade.service';

const mockResult = {
  headline: 'Senior Frontend Developer | Angular',
  about: 'Experienced developer with a passion for clean code.',
  experience: [
    { role: 'Frontend Dev', company: 'Acme', improvedBullets: ['Led migration', 'Improved performance'] },
  ],
};

function makeAuthMock(plan = 'PRO') {
  return { user: () => ({ id: '1', email: 'a@b.de', name: 'Hans', plan, emailVerified: true, twoFactorEnabled: false }) };
}

describe('LinkedInComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  function setupWithPlan(plan = 'PRO') {
    return TestBed.configureTestingModule({
      imports: [LinkedInComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: makeAuthMock(plan) },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    api = { post: jest.fn() };
  });

  it('result is null initially', async () => {
    await setupWithPlan();
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.result()).toBeNull();
  });

  it('isPro is true for PRO plan', async () => {
    await setupWithPlan('PRO');
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.isPro()).toBe(true);
  });

  it('isPro is false for FREE plan', async () => {
    await setupWithPlan('FREE');
    const f = TestBed.createComponent(LinkedInComponent);
    expect(f.componentInstance.isPro()).toBe(false);
  });

  it('shows pro gate and hides form for free user', async () => {
    await setupWithPlan('FREE');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const gate = f.nativeElement.querySelector('.empty-state');
    const form = f.nativeElement.querySelector('form');
    expect(gate).not.toBeNull();
    expect(form).toBeNull();
  });

  it('shows form and hides gate for Pro user', async () => {
    await setupWithPlan('PRO');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const gate = f.nativeElement.querySelector('.empty-state');
    const form = f.nativeElement.querySelector('form');
    expect(gate).toBeNull();
    expect(form).not.toBeNull();
  });

  it('calls UpgradeService.request() when upgrade button is clicked', async () => {
    await setupWithPlan('FREE');
    const upgradeService = TestBed.inject(UpgradeService);
    const spy = jest.spyOn(upgradeService, 'request');
    const f = TestBed.createComponent(LinkedInComponent);
    f.detectChanges();
    const upgradeBtn = f.nativeElement.querySelector('button[aria-label="Jetzt upgraden"]') as HTMLButtonElement;
    upgradeBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loading is true during optimization, false after', async () => {
    await setupWithPlan('PRO');
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
    await setupWithPlan('PRO');
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Frontend Developer' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.result()).toEqual(mockResult);
    expect(f.componentInstance.error()).toBeNull();
  });

  it('sets error on API failure', async () => {
    await setupWithPlan('PRO');
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'AI timeout' } }));
    const f = TestBed.createComponent(LinkedInComponent);
    f.componentInstance.form.setValue({ profileText: 'x'.repeat(60), targetRole: 'Dev' });
    await f.componentInstance.optimize();
    expect(f.componentInstance.error()).toBe('AI timeout');
  });

  it('calls POST /linkedin/optimize with profileText and targetRole', async () => {
    await setupWithPlan('PRO');
    api.post.mockResolvedValue(mockResult);
    const f = TestBed.createComponent(LinkedInComponent);
    const profileText = 'x'.repeat(60);
    f.componentInstance.form.setValue({ profileText, targetRole: 'Senior Dev' });
    await f.componentInstance.optimize();
    expect(api.post).toHaveBeenCalledWith('/linkedin/optimize', { profileText, targetRole: 'Senior Dev' });
  });

  it('copiedField set after copyField and cleared after 2s', async () => {
    await setupWithPlan('PRO');
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
