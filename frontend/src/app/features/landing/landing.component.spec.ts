import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LandingComponent', () => {
  let auth: Pick<AuthService, 'login' | 'register'>;
  let queryParamMap = convertToParamMap({});

  beforeEach(async () => {
    queryParamMap = convertToParamMap({});
    auth = {
      login: jest.fn().mockResolvedValue(undefined) as AuthService['login'],
      register: jest.fn().mockResolvedValue(undefined) as AuthService['register'],
    };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return queryParamMap;
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compose all landing sections', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('lba-navbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-hero')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-logo-bar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-features-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-workflow-steps')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-before-after')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-testimonials')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-pricing-inline')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-cta-band')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-footer')).toBeTruthy();
  });

  it('submits optional 2FA code from the landing login modal', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const loginButton = fixture.nativeElement.querySelector('.nav__actions .btn--ghost') as HTMLButtonElement;
    loginButton.click();
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('input[name="loginEmail"]') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('input[name="loginPassword"]') as HTMLInputElement;
    const totp = fixture.nativeElement.querySelector('input[name="loginTotp"]') as HTMLInputElement;
    email.value = 'lina@example.de';
    email.dispatchEvent(new Event('input'));
    password.value = 'validpass123';
    password.dispatchEvent(new Event('input'));
    totp.value = '123456';
    totp.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('.modal-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith('lina@example.de', 'validpass123', '123456');
    expect(navigate).toHaveBeenCalledWith(['/app']);
  });

  it('keeps the login modal open when the backdrop is clicked', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    const loginButton = fixture.nativeElement.querySelector('.nav__actions .btn--ghost') as HTMLButtonElement;
    loginButton.click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#login-dialog-title')).toBeTruthy();
  });

  it('keeps the register modal open when the backdrop is clicked', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    const registerButton = fixture.nativeElement.querySelector('.nav__actions .btn--primary') as HTMLButtonElement;
    registerButton.click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#register-dialog-title')).toBeTruthy();
  });

  it('still closes the login modal through the explicit close button', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    const loginButton = fixture.nativeElement.querySelector('.nav__actions .btn--ghost') as HTMLButtonElement;
    loginButton.click();
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.modal__close') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens the login modal after email verification redirects to the landing page', () => {
    queryParamMap = convertToParamMap({ auth: 'login', verified: '1' });
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#login-dialog-title')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('E-Mail bestätigt');
  });
});
