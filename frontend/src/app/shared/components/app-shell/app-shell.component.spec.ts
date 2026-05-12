import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthService } from '../../../core/auth/auth.service';

interface MockUser {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'PAY_PER_APP' | 'PRO' | 'free' | 'pay' | 'pro';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

const mockUser: MockUser = {
  id: '1',
  email: 'test@test.de',
  name: 'Hans',
  plan: 'FREE',
  emailVerified: true,
  twoFactorEnabled: false,
};

function makeAuthMock(user: MockUser | null = mockUser) {
  return {
    user: () => user,
    logout: jest.fn().mockResolvedValue(undefined),
  };
}

async function setup(authMock = makeAuthMock()) {
  await TestBed.configureTestingModule({
    imports: [AppShellComponent],
    providers: [
      { provide: AuthService, useValue: authMock },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AppShellComponent);
  fixture.detectChanges();
  return { fixture, authMock };
}

describe('AppShellComponent', () => {
  it('renders nav links for Dashboard, Lebensläufe, Abrechnung', async () => {
    const { fixture } = await setup();
    const links = fixture.debugElement.queryAll(By.css('.shell__link'));
    const texts = links.map(l => (l.nativeElement as HTMLElement).textContent?.trim());
    expect(texts).toEqual(['Dashboard', 'Lebensläufe', 'Abrechnung']);
  });

  it('displays the user name', async () => {
    const { fixture } = await setup();
    const name = fixture.debugElement.query(By.css('.shell__name'));
    expect((name.nativeElement as HTMLElement).textContent?.trim()).toBe('Hans');
  });

  it('shows Free badge for free plan', async () => {
    const { fixture } = await setup();
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Free');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--free');
  });

  it('shows Pay-per-App badge for PAY_PER_APP plan', async () => {
    const { fixture } = await setup(makeAuthMock({ ...mockUser, plan: 'PAY_PER_APP' }));
    const badge = fixture.debugElement.query(By.css('.shell__plan'));
    expect((badge.nativeElement as HTMLElement).textContent?.trim()).toBe('Pay-per-App');
    expect((badge.nativeElement as HTMLElement).classList).toContain('shell__plan--pay');
  });

  it('shows Pro badge for PRO plan', async () => {
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
});
