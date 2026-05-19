import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApplicationsComponent } from './applications.component';
import { ApiService } from '../../core/api/api.service';
import { LEGACY_OPEN_STATUS } from '../../shared/utils/status.utils';

const mockApplications = [
  { id: '1', status: LEGACY_OPEN_STATUS, matchScore: 88, createdAt: '2024-01-01', jobPosting: { parsedJson: { title: 'Dev', company: 'Stripe' } } },
  { id: '2', status: 'INTERVIEW', matchScore: 76, createdAt: '2024-01-02', jobPosting: { parsedJson: { title: 'Designer', company: 'Figma' } } },
];

const mockApi = {
  get: jest.fn().mockResolvedValue(mockApplications),
  patch: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
};

describe('ApplicationsComponent', () => {
  let fixture: ComponentFixture<ApplicationsComponent>;
  let component: ApplicationsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsComponent],
      providers: [
        { provide: ApiService, useValue: mockApi },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('has loading signal false after data loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('renders application cards after load', () => {
    const cards = fixture.nativeElement.querySelectorAll('.apps-card');
    expect(cards.length).toBe(2);
  });

  it('shows "Neue Bewerbung" CTA button', () => {
    const btn = fixture.nativeElement.querySelector('a[routerLink="/app/wizard"]');
    expect(btn).not.toBeNull();
  });

  it('shows view toggle with Liste and Pipeline links', () => {
    const btns = fixture.nativeElement.querySelectorAll('.view-toggle__btn');
    expect(btns.length).toBe(2);
  });

  it('filters applications by search query', () => {
    component.searchQuery.set('stripe');
    expect(component.filteredApplications().length).toBe(1);
    expect(component.filteredApplications()[0].id).toBe('1');
  });

  it('maps OPEN status to APPLIED for status pill', () => {
    expect(component.toApplicationStatus(LEGACY_OPEN_STATUS)).toBe('APPLIED');
    expect(component.toApplicationStatus('INTERVIEW')).toBe('INTERVIEW');
    expect(component.toApplicationStatus('OFFER')).toBe('OFFER');
  });

  it('sets error signal when API fails', async () => {
    mockApi.get.mockRejectedValueOnce({ status: 500 });
    await component.loadData();
    expect(component.error()).toBeTruthy();
  });
});
