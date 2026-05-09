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
  });

  it('renders both pricing cards', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pay-per-App');
    expect(fixture.nativeElement.textContent).toContain('Pro');
  });

  it('opens Paddle checkout with current user id', () => {
    const open = jest.fn();
    (globalThis as { Paddle?: unknown }).Paddle = { Checkout: { open } };
    const fixture = TestBed.createComponent(PricingComponent);

    fixture.componentInstance.openProCheckout();

    expect(open).toHaveBeenCalledWith({
      items: [{ priceId: 'pri_pro_monthly_placeholder', quantity: 1 }],
      customData: { userId: 'u1' },
    });
  });

  it('sets an error when Paddle is unavailable', () => {
    const fixture = TestBed.createComponent(PricingComponent);

    fixture.componentInstance.openProCheckout();

    expect(fixture.componentInstance.checkoutError()).toContain('Checkout konnte nicht geladen werden');
  });
});
