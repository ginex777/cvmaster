import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/api/api.service';

const emptyDashboard = { onboardingDismissed: false, cvCount: 0, applicationCount: 0, avgMatchScore: null, recentApplications: [] };

describe('DashboardComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'patch' | 'delete' | 'post'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), patch: jest.fn(), delete: jest.fn(), post: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('loading is true on init, false after data loads', async () => {
    let resolve!: (v: unknown) => void;
    api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve({ onboardingDismissed: false, cvCount: 2, applicationCount: 5, avgMatchScore: 81, recentApplications: [] });
    await fixture.whenStable();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.data()?.cvCount).toBe(2);
  });

  it('error signal is set when API throws HttpErrorResponse', async () => {
    api.get.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Server error' } }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Server error');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('error signal is set to fallback message for non-HTTP errors', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Daten konnten nicht geladen werden.');
  });

  it('renders stat cards when data is loaded', async () => {
    api.get.mockResolvedValue({ onboardingDismissed: true, cvCount: 3, applicationCount: 7, avgMatchScore: 75, recentApplications: [] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('75');
  });

  it('aria-live error region is rendered when error signal is set', async () => {
    api.get.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Fehler' } }),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role=alert]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler');
  });

  it('maps score >= 80 to score--high, >= 60 to score--mid, else score--low', () => {
    api.get.mockResolvedValue(emptyDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance.scoreClass(85)).toBe('score--high');
    expect(fixture.componentInstance.scoreClass(65)).toBe('score--mid');
    expect(fixture.componentInstance.scoreClass(40)).toBe('score--low');
  });

  it('toggles application status optimistically and persists it', async () => {
    api.get.mockResolvedValue({
      onboardingDismissed: true,
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 80,
      recentApplications: [
        { id: 'app-1', status: 'OPEN', matchScore: 80, createdAt: '2026-05-10T00:00:00Z', jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } },
      ],
    });
    api.patch.mockResolvedValue({});
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const promise = fixture.componentInstance.toggleStatus('app-1');

    expect(fixture.componentInstance.data()?.recentApplications[0].status).toBe('DONE');
    await promise;
    expect(api.patch).toHaveBeenCalledWith('/applications/app-1/status', { status: 'DONE' });
  });

  it('rolls status back and sets error when status persistence fails', async () => {
    api.get.mockResolvedValue({
      onboardingDismissed: true,
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 80,
      recentApplications: [
        { id: 'app-1', status: 'OPEN', matchScore: 80, createdAt: '2026-05-10T00:00:00Z', jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } },
      ],
    });
    api.patch.mockRejectedValue(new HttpErrorResponse({ status: 500 }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    await fixture.componentInstance.toggleStatus('app-1');

    expect(fixture.componentInstance.data()?.recentApplications[0].status).toBe('OPEN');
    expect(fixture.componentInstance.error()).not.toBeNull();
  });

  it('deletes an application after confirmation', async () => {
    api.get.mockResolvedValue({
      onboardingDismissed: true,
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 80,
      recentApplications: [
        { id: 'app-1', status: 'OPEN', matchScore: 80, createdAt: '2026-05-10T00:00:00Z', jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } },
      ],
    });
    api.delete.mockResolvedValue({});
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.requestDelete('app-1');
    await fixture.componentInstance.confirmDelete();

    expect(api.delete).toHaveBeenCalledWith('/applications/app-1');
    expect(fixture.componentInstance.data()?.recentApplications).toHaveLength(0);
    expect(fixture.componentInstance.data()?.applicationCount).toBe(0);
  });

  describe('pipeline view', () => {
    const appData = {
      onboardingDismissed: true,
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 80,
      recentApplications: [
        { id: 'app-1', status: 'OPEN', matchScore: 80, createdAt: '2026-05-10T00:00:00Z', reminderAt: null, jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } },
      ],
    };

    it('toggleView switches showPipeline signal', () => {
      api.get.mockResolvedValue(emptyDashboard);
      const fixture = TestBed.createComponent(DashboardComponent);
      expect(fixture.componentInstance.showPipeline()).toBe(false);
      fixture.componentInstance.toggleView();
      expect(fixture.componentInstance.showPipeline()).toBe(true);
    });

    it('onStatusChange calls PATCH /applications/:id/status', async () => {
      api.get.mockResolvedValue(appData);
      api.patch.mockResolvedValue({});
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.onStatusChange({ id: 'app-1', status: 'SENT' });

      expect(api.patch).toHaveBeenCalledWith('/applications/app-1/status', { status: 'SENT' });
    });

    it('onReminderChange calls PATCH /applications/:id/reminder', async () => {
      api.get.mockResolvedValue(appData);
      api.patch.mockResolvedValue({});
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.onReminderChange({ id: 'app-1', reminderAt: '2026-06-15' });

      expect(api.patch).toHaveBeenCalledWith('/applications/app-1/reminder', expect.objectContaining({ reminderAt: expect.any(String) }));
    });

    it('onReminderChange with null sends null reminderAt', async () => {
      api.get.mockResolvedValue(appData);
      api.patch.mockResolvedValue({});
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.onReminderChange({ id: 'app-1', reminderAt: null });

      expect(api.patch).toHaveBeenCalledWith('/applications/app-1/reminder', { reminderAt: null });
    });
  });

  describe('onboarding', () => {
    it('shows onboarding panel when onboardingDismissed is false', async () => {
      api.get.mockResolvedValue({ ...emptyDashboard, onboardingDismissed: false });
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.onboarding')).toBeTruthy();
    });

    it('hides onboarding panel when onboardingDismissed is true', async () => {
      api.get.mockResolvedValue({ ...emptyDashboard, onboardingDismissed: true });
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.onboarding')).toBeNull();
    });

    it('marks CV step done when cvCount > 0', async () => {
      api.get.mockResolvedValue({ ...emptyDashboard, cvCount: 1 });
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const steps = fixture.componentInstance.onboardingSteps();
      expect(steps?.cvUploaded).toBe(true);
      expect(steps?.applicationCreated).toBe(false);
    });

    it('marks application step done when applicationCount > 0', async () => {
      api.get.mockResolvedValue({ ...emptyDashboard, applicationCount: 2 });
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.onboardingSteps()?.applicationCreated).toBe(true);
    });

    it('marks exported step done when a recent application has status SENT', async () => {
      api.get.mockResolvedValue({
        ...emptyDashboard,
        applicationCount: 1,
        recentApplications: [
          { id: 'a1', status: 'SENT', matchScore: null, createdAt: '2026-05-10T00:00:00Z', jobPosting: { parsedJson: {} } },
        ],
      });
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.onboardingSteps()?.exported).toBe(true);
    });

    it('calls POST /users/me/dismiss-onboarding and hides panel', async () => {
      api.get.mockResolvedValue({ ...emptyDashboard, onboardingDismissed: false });
      api.post.mockResolvedValue({});
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      await fixture.componentInstance.dismissOnboarding();

      expect(api.post).toHaveBeenCalledWith('/users/me/dismiss-onboarding', {});
      expect(fixture.componentInstance.data()?.onboardingDismissed).toBe(true);
    });
  });
});
