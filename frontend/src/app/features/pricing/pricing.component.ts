import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

interface PaddleCheckout {
  Checkout: {
    open(config: {
      items: Array<{ priceId: string; quantity: number }>;
      customData: { userId?: string };
    }): void;
  };
}

@Component({
  selector: 'lba-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
  private readonly auth = inject(AuthService);

  readonly checkoutError = signal<string | null>(null);

  openProCheckout(): void {
    this.checkoutError.set(null);
    const paddle = this.getPaddle();

    if (!paddle) {
      this.checkoutError.set('Checkout konnte nicht geladen werden. Bitte versuche es gleich erneut.');
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId: environment.paddlePriceIdPro, quantity: 1 }],
      customData: { userId: this.auth.user()?.id },
    });
  }

  private getPaddle(): PaddleCheckout | null {
    const candidate = (globalThis as { Paddle?: PaddleCheckout }).Paddle;
    return candidate?.Checkout?.open ? candidate : null;
  }
}
