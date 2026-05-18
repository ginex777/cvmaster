import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/api/api.service';
import { LEGACY_DONE_STATUS, LEGACY_OPEN_STATUS } from '../../shared/utils/status.utils';

const emptyDashboard = {
  onboardingDismissed: true,
  cvCount: 0,
  applicationCount: 0,
  avgMatchScore: null,
  recentApplications: [],
};

const recentDate = new Date().toISOString();

const fullDashboard = {
  onboardingDismissed: true,
  cvCount: 3,
  applicationCount: 5,
  avgMatchScore: 82,
  recentApplications: [
    { id: '1', status: LEGACY_OPEN_STATUS, matchScore: 88, createdAt: recentDate, jobPosting: { parsedJson: { title: 'Dev', company: 'Stripe' } } },
    { id: '2', status: 'INTERVIEW', matchScore: 76, createdAt: recentDate, jobPosting: { parsedJson: { title: 'Designer', company: 'Figma' } } },
  ],
};

describe('DashboardComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get'>>;

  beforeEach(async () => {
    api = { get: jest.fn() };
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
    api.get.mockReturnValue(new Promise(r => { resolve = r; }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve(fullDashboard);
    await fixture.whenStable();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('error signal is set when API throws HttpErrorResponse', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Server error' } }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Server error');
  });

  it('error signal falls back for non-HTTP errors', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('Daten konnten nicht geladen werden.');
  });

  it('renders 4 stat cards when data is loaded', async () => {
    api.get.mockResolvedValue(fullDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.stat-card:not(.stat-card--skeleton)');
    expect(cards.length).toBe(4);
  });

  it('renders 5 pipeline-preview columns', async () => {
    api.get.mockResolvedValue(fullDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cols = fixture.nativeElement.querySelectorAll('.pipeline-preview__col');
    expect(cols.length).toBe(5);
  });

  it('pipelineColumns computed groups apps by mapped status', async () => {
    api.get.mockResolvedValue(fullDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cols = fixture.componentInstance.pipelineColumns();
    expect(cols.length).toBe(5);
    const applied = cols.find(c => c.key === 'APPLIED');
    expect(applied?.count).toBe(1); // OPEN → APPLIED
    const interview = cols.find(c => c.key === 'INTERVIEW');
    expect(interview?.count).toBe(1);
  });

  it('toApplicationStatus maps old backend values to new 5-stage model', () => {
    api.get.mockResolvedValue(emptyDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    const c = fixture.componentInstance;
    expect(c.toApplicationStatus(LEGACY_OPEN_STATUS)).toBe('APPLIED');
    expect(c.toApplicationStatus(LEGACY_DONE_STATUS)).toBe('APPLIED');
    expect(c.toApplicationStatus('INTERVIEW')).toBe('INTERVIEW');
    expect(c.toApplicationStatus('OFFER')).toBe('OFFER');
    expect(c.toApplicationStatus('REJECTED')).toBe('REJECTED');
  });

  it('renders aria-live alert when error is set', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' } }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role=alert]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler');
  });

  it('shows activity list items for recent applications', async () => {
    api.get.mockResolvedValue(fullDashboard);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.activity-item');
    expect(items.length).toBe(2);
  });
});
