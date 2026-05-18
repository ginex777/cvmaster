import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PipelineComponent } from './pipeline.component';
import { ApiService } from '../../core/api/api.service';
import { LEGACY_OPEN_STATUS } from '../../shared/utils/status.utils';

const mockApi = {
  get: jest.fn().mockResolvedValue({
    cvCount: 1,
    applicationCount: 3,
    avgMatchScore: 80,
    onboardingDismissed: true,
    recentApplications: [
      { id: '1', status: LEGACY_OPEN_STATUS, matchScore: 88, createdAt: '2024-01-01', jobPosting: { parsedJson: { title: 'Dev', company: 'Stripe' } } },
    ],
  }),
  patch: jest.fn().mockResolvedValue({}),
};

describe('PipelineComponent', () => {
  let fixture: ComponentFixture<PipelineComponent>;
  let component: PipelineComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipelineComponent],
      providers: [
        { provide: ApiService, useValue: mockApi },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PipelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('starts with loading false after data resolves', () => {
    expect(component.loading()).toBe(false);
  });

  it('renders the pipeline board after load', () => {
    const board = fixture.nativeElement.querySelector('lba-pipeline-board');
    expect(board).not.toBeNull();
  });

  it('has a Neue Bewerbung CTA', () => {
    const cta = fixture.nativeElement.querySelector('a[routerLink="/app/wizard"]');
    expect(cta).not.toBeNull();
  });

  it('has a Liste view-toggle link to /app/applications', () => {
    const link = fixture.nativeElement.querySelector('a[routerLink="/app/applications"]');
    expect(link).not.toBeNull();
  });

  it('shows error when API fails', async () => {
    mockApi.get.mockRejectedValueOnce({ status: 500 });
    await component.loadData();
    expect(component.error()).toBeTruthy();
  });
});
