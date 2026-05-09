import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/api/api.service';

const emptyDashboard = { cvCount: 0, applicationCount: 0, recentApplications: [] };

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
    api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve({ cvCount: 2, applicationCount: 5, recentApplications: [] });
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
    api.get.mockResolvedValue({ cvCount: 3, applicationCount: 7, recentApplications: [] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(2);
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
});
