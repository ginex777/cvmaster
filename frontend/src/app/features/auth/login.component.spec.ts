import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let authService: jest.Mocked<Pick<AuthService, 'login'>>;

  beforeEach(async () => {
    authService = { login: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('renders email, password, and two-factor fields', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#login-email')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#login-password')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#login-totp')).toBeTruthy();
  });

  it('submit button is present', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');
    expect(btn).toBeTruthy();
  });

  it('loading is true during login call, false after', async () => {
    let resolve!: () => void;
    authService.login.mockReturnValue(new Promise((r) => { resolve = () => r(undefined); }));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'validpass', totp: '' });
    const p = fixture.componentInstance.submit();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve();
    await p;
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('error signal is set when API throws HttpErrorResponse', async () => {
    authService.login.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Ungültige Zugangsdaten' } }),
    );
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'wrongpass', totp: '' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Ungültige Zugangsdaten');
  });

  it('error signal is set to fallback message for non-HTTP errors', async () => {
    authService.login.mockRejectedValue(new Error('network'));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'wrongpass', totp: '' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Anmeldung fehlgeschlagen.');
  });

  it('does not call authService.login when form is invalid', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.componentInstance.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('aria-live error region is rendered when error signal is set', async () => {
    authService.login.mockRejectedValue(
      new HttpErrorResponse({ error: { message: 'Fehler' } }),
    );
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'wrongpass', totp: '' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[aria-live]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler');
  });

  it('passes the TOTP code to AuthService when provided', async () => {
    authService.login.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'validpass', totp: '123456' });

    await fixture.componentInstance.submit();

    expect(authService.login).toHaveBeenCalledWith('a@b.de', 'validpass', '123456');
  });

  it('does not call AuthService when TOTP has an invalid format', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de', password: 'validpass', totp: 'abc' });

    await fixture.componentInstance.submit();

    expect(authService.login).not.toHaveBeenCalled();
  });
});
