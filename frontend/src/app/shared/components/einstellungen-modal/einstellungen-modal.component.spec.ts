import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EinstellungenModalComponent } from './einstellungen-modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { SeoService } from '../../../core/seo/seo.service';

const mockAuth = {
  user: Object.assign(() => ({ id: '1', email: 'a@b.de', name: 'Hans', plan: 'PRO', emailVerified: true, twoFactorEnabled: false }), { subscribe: jest.fn() }),
  isAuthenticated: Object.assign(() => true, { subscribe: jest.fn() }),
  logout: jest.fn(),
  clearSession: jest.fn(),
};

const mockApi = {
  get: jest.fn().mockResolvedValue([]),
  post: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  getBlob: jest.fn().mockResolvedValue(new Blob()),
};

const mockSeo = { setPage: jest.fn() };

const providers = [
  { provide: AuthService, useValue: mockAuth },
  { provide: ApiService, useValue: mockApi },
  { provide: SeoService, useValue: mockSeo },
  provideRouter([]),
];

describe('EinstellungenModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EinstellungenModalComponent],
      providers,
    }).compileComponents();
  });

  function createComponent(open = true) {
    const fixture = TestBed.createComponent(EinstellungenModalComponent);
    fixture.componentRef.setInput('open', open);
    fixture.detectChanges();
    return fixture;
  }

  it('is hidden when open is false', () => {
    const fixture = createComponent(false);
    const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
    expect(backdrop).toBeNull();
  });

  it('renders dialog when open is true', () => {
    const fixture = createComponent(true);
    const dialog = fixture.debugElement.query(By.css('[role="dialog"]'));
    expect(dialog).not.toBeNull();
  });

  it('shows Abrechnung tab by default', () => {
    const fixture = createComponent(true);
    const activeTab = fixture.debugElement.query(By.css('.modal-tab.is-active'));
    expect((activeTab.nativeElement as HTMLElement).textContent?.trim()).toBe('Abrechnung');
  });

  it('switches to Sicherheit tab on click', () => {
    const fixture = createComponent(true);
    const tabs = fixture.debugElement.queryAll(By.css('.modal-tab'));
    const sicherheit = tabs.find(t => (t.nativeElement as HTMLElement).textContent?.trim() === 'Sicherheit');
    (sicherheit!.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['activeTab']()).toBe('sicherheit');
  });

  it('emits closeModal when ✕ button is clicked', () => {
    const fixture = TestBed.createComponent(EinstellungenModalComponent);
    let callCount = 0;
    fixture.componentInstance.closeModal.subscribe(() => { callCount++; });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const closeBtn = fixture.debugElement.query(By.css('button[aria-label="Schließen"]'));
    (closeBtn.nativeElement as HTMLButtonElement).click();
    expect(callCount).toBe(1);
  });

  it('emits closeModal when backdrop is clicked', () => {
    const fixture = TestBed.createComponent(EinstellungenModalComponent);
    let callCount = 0;
    fixture.componentInstance.closeModal.subscribe(() => { callCount++; });
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
    (backdrop.nativeElement as HTMLElement).click();
    expect(callCount).toBe(1);
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const fixture = createComponent(true);
    const dialog = fixture.debugElement.query(By.css('[role="dialog"]'));
    expect(dialog.nativeElement.getAttribute('aria-modal')).toBe('true');
  });
});
