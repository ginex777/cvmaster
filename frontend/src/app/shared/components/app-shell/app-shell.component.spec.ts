import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { SeoService } from '../../../core/seo/seo.service';

interface MockUser {
  id: string; email: string; name: string;
  plan: 'FREE' | 'PAY_PER_APP' | 'PRO' | 'free' | 'pay' | 'pro';
  emailVerified: boolean; twoFactorEnabled: boolean;
}

const mockUser: MockUser = {
  id: '1', email: 'test@test.de', name: 'Hans', plan: 'FREE',
  emailVerified: true, twoFactorEnabled: false,
};

function makeAuthMock(user: MockUser | null = mockUser) {
  return { user: () => user, logout: jest.fn().mockResolvedValue(undefined) };
}

const mockApiService = {
  get: jest.fn().mockResolvedValue([]),
  post: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  getBlob: jest.fn().mockResolvedValue(new Blob()),
};

const mockSeoService = {
  setPage: jest.fn(),
};

async function setup(authMock = makeAuthMock()) {
  await TestBed.configureTestingModule({
    imports: [AppShellComponent],
    providers: [
      { provide: AuthService, useValue: authMock },
      { provide: ApiService, useValue: mockApiService },
      { provide: SeoService, useValue: mockSeoService },
      provideRouter([]),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AppShellComponent);
  fixture.detectChanges();
  return { fixture, authMock };
}

describe('AppShellComponent', () => {
  it('renders sidebar nav links: Dashboard, Lebensläufe, LinkedIn', async () => {
    const { fixture } = await setup();
    const links = fixture.debugElement.queryAll(By.css('.shell__link'));
    const ariaLabels = links.map(l => (l.nativeElement as HTMLElement).getAttribute('aria-label') ?? '');
    expect(ariaLabels).toContain('Dashboard');
    expect(ariaLabels).toContain('Lebensläufe');
    // LinkedIn aria-label varies by plan; just check the element exists
    const linkedInEl = links.find(l =>
      (l.nativeElement as HTMLElement).textContent?.includes('LinkedIn')
    );
    expect(linkedInEl).toBeTruthy();
    expect(ariaLabels).not.toContain('Abrechnung');
    expect(ariaLabels).not.toContain('Sicherheit');
  });

  it('shows plan-lock badge on LinkedIn link for free user', async () => {
    const { fixture } = await setup();
    const lock = fixture.debugElement.query(By.css('.plan-lock'));
    expect(lock).not.toBeNull();
  });

  it('does not show plan-lock badge for PRO user', async () => {
    const { fixture } = await setup(makeAuthMock({ ...mockUser, plan: 'PRO' }));
    fixture.detectChanges();
    const lock = fixture.debugElement.query(By.css('.plan-lock'));
    expect(lock).toBeNull();
  });

  it('displays the user name', async () => {
    const { fixture } = await setup();
    const el = fixture.debugElement.query(By.css('.shell__username'));
    expect((el.nativeElement as HTMLElement).textContent?.trim()).toBe('Hans');
  });

  it('shows Free plan badge', async () => {
    const { fixture } = await setup();
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Free');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--free');
  });

  it('shows Pro plan badge for PRO user', async () => {
    const { fixture } = await setup(makeAuthMock({ ...mockUser, plan: 'PRO' }));
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Pro');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--pro');
  });

  it('calls auth.logout() when Abmelden is clicked', async () => {
    const authMock = makeAuthMock();
    const { fixture } = await setup(authMock);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Abmelden"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(authMock.logout).toHaveBeenCalledTimes(1);
  });

  it('opens Einstellungen modal when Einstellungen button is clicked', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance['einstellungenOpen']()).toBe(false);
    const btn = fixture.debugElement.query(By.css('button[aria-label="Einstellungen öffnen"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['einstellungenOpen']()).toBe(true);
  });
});
