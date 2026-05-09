import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/auth/auth.service';

describe('RegisterComponent', () => {
  let authService: jest.Mocked<Pick<AuthService, 'register'>>;

  beforeEach(async () => {
    authService = { register: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('renders name, email, password fields and art9Consent checkbox', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('reg-name');
    expect(html).toContain('reg-email');
    expect(html).toContain('reg-password');
    expect(html).toContain('art9');
  });

  it('submit button is present', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(btn).toBeTruthy();
  });

  it('loading is true during register call, false after', async () => {
    let resolve!: () => void;
    authService.register.mockReturnValue(new Promise((r) => { resolve = () => r(undefined); }));
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: 'Anna',
      email: 'anna@example.de',
      password: 'securepass123',
      art9Consent: true,
    });
    const p = fixture.componentInstance.submit();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve();
    await p;
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('error signal is set when API throws HttpErrorResponse', async () => {
    authService.register.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'E-Mail bereits vergeben' } }),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: 'Anna',
      email: 'anna@example.de',
      password: 'securepass123',
      art9Consent: true,
    });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('E-Mail bereits vergeben');
  });

  it('error signal is set to fallback message for non-HTTP errors', async () => {
    authService.register.mockRejectedValue(new Error('network'));
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: 'Anna',
      email: 'anna@example.de',
      password: 'securepass123',
      art9Consent: true,
    });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Registrierung fehlgeschlagen.');
  });

  it('does not call authService.register when form is invalid', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.componentInstance.submit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('aria-live error region is rendered when error signal is set', async () => {
    authService.register.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Fehler' } }),
    );
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: 'Anna',
      email: 'anna@example.de',
      password: 'securepass123',
      art9Consent: true,
    });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[aria-live]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler');
  });
});
