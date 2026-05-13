import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PricingComponent } from './pricing.component';
import { AuthService } from '../../core/auth/auth.service';

describe('PricingComponent', () => {
  let auth: Pick<AuthService, 'user'>;

  beforeEach(async () => {
    auth = {
      user: signal({ id: 'u1', email: 'a@b.de', name: 'Lina', plan: 'free', emailVerified: true, twoFactorEnabled: false }),
    };

    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    delete (globalThis as { Paddle?: unknown }).Paddle;
    delete (globalThis as { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__;
  });

  it('renders both pricing cards', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pay-per-App');
    expect(fixture.nativeElement.textContent).toContain('Pro');
  });

  it('opens Paddle checkout with current user id', async () => {
    const open = jest.fn();
    const initialize = jest.fn();
    const setEnvironment = jest.fn();
    (globalThis as { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__ = {
      paddleClientToken: 'test_token',
      paddleEnvironment: 'sandbox',
      paddlePriceIdPro: 'pri_test_pro',
    };
    (globalThis as { Paddle?: unknown }).Paddle = {
      Environment: { set: setEnvironment },
      Initialize: initialize,
      Checkout: { open },
    };
    const fixture = TestBed.createComponent(PricingComponent);

    await fixture.componentInstance.openProCheckout();

    expect(setEnvironment).toHaveBeenCalledWith('sandbox');
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ token: 'test_token' }));
    expect(open).toHaveBeenCalledWith({
      items: [{ priceId: 'pri_test_pro', quantity: 1 }],
      customData: { userId: 'u1' },
      customer: { email: 'a@b.de' },
      settings: { displayMode: 'overlay', theme: 'light', locale: 'de' },
    });
  });

  it('sets an error when Paddle config is missing', async () => {
    const fixture = TestBed.createComponent(PricingComponent);

    await fixture.componentInstance.openProCheckout();

    expect(fixture.componentInstance.checkoutError()).toContain('Checkout ist noch nicht konfiguriert');
  });
});
