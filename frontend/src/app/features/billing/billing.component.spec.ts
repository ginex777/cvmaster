import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { BillingComponent } from './billing.component';

describe('BillingComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'getBlob' | 'delete'>>;
  let auth: Pick<AuthService, 'user' | 'clearSession'>;

  beforeEach(async () => {
    delete (globalThis as { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__;
    api = { getBlob: jest.fn(), delete: jest.fn() };
    api.getBlob.mockResolvedValue(new Blob(['{}'], { type: 'application/json' }));
    api.delete.mockResolvedValue({ message: 'ok' });
    auth = {
      user: signal({ id: 'u1', email: 'a@b.de', name: 'Lina', plan: 'free', emailVerified: true, twoFactorEnabled: false }),
      clearSession: jest.fn(() => auth.user.set(null)),
    };

    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('renders plan info and GDPR actions', () => {
    const fixture = TestBed.createComponent(BillingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Free');
    expect(fixture.nativeElement.textContent).toContain('Daten exportieren');
    expect(fixture.nativeElement.textContent).toContain('Konto loeschen');
  });

  it('renders Paddle customer portal link when configured', () => {
    (globalThis as { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__ = {
      paddleCustomerPortalUrl: 'https://customer-portal.paddle.com/session',
    };
    const fixture = TestBed.createComponent(BillingComponent);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a[href="https://customer-portal.paddle.com/session"]');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Paddle Portal');
  });

  it('downloads GDPR export', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    const anchor = document.createElement('a');
    const click = jest.fn();
    Object.defineProperty(anchor, 'click', { value: click });

    const fixture = TestBed.createComponent(BillingComponent);
    const createElement = jest.spyOn(document, 'createElement').mockReturnValue(anchor);

    await fixture.componentInstance.exportData();

    expect(api.getBlob).toHaveBeenCalledWith('/gdpr/export');
    expect(anchor.download).toBe('meine-daten.json');
    expect(click).toHaveBeenCalled();

    createElement.mockRestore();
  });

  it('deletes account after confirmation', async () => {
    Object.defineProperty(window, 'confirm', { configurable: true, value: jest.fn(() => true) });
    const fixture = TestBed.createComponent(BillingComponent);
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.deleteAccount();

    expect(api.delete).toHaveBeenCalledWith('/gdpr/account');
    expect(auth.clearSession).toHaveBeenCalled();
    expect(auth.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
