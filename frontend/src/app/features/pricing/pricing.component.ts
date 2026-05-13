import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

interface PaddleCheckout {
  Environment?: {
    set(environment: 'sandbox' | 'production'): void;
  };
  Initialize(config: {
    token: string;
    checkout?: {
      settings?: {
        displayMode?: 'overlay';
        theme?: 'light';
        locale?: 'de';
      };
    };
  }): void;
  Checkout: {
    open(config: {
      items: Array<{ priceId: string; quantity: number }>;
      customData: { userId?: string };
      customer?: { email?: string };
      settings?: { displayMode: 'overlay'; theme: 'light'; locale: 'de' };
    }): void;
  };
}

interface PaddleRuntimeConfig {
  paddleClientToken?: string;
  paddleEnvironment?: 'sandbox' | 'production';
  paddlePriceIdPro?: string;
  paddlePriceIdPayPerApp?: string;
  paddlePriceIdProMonthly?: string;
  paddlePriceIdProYearly?: string;
}

type CheckoutPlan = 'payPerApp' | 'proMonthly' | 'proYearly';

const PADDLE_SCRIPT_ID = 'paddle-js';
const PADDLE_SCRIPT_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';

@Component({
  selector: 'lba-pricing',
  standalone: true,
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent {
  private readonly auth = inject(AuthService);

  readonly checkoutError = signal<string | null>(null);
  readonly checkoutLoading = signal(false);
  readonly selectedPlan = signal<CheckoutPlan>('proMonthly');
  private paddleInitialized = false;

  get checkoutErrorMessage(): string | null {
    return this.checkoutError();
  }

  selectPlan(plan: CheckoutPlan): void {
    this.selectedPlan.set(plan);
    this.checkoutError.set(null);
  }

  async openCheckout(plan = this.selectedPlan()): Promise<void> {
    this.checkoutError.set(null);
    this.checkoutLoading.set(true);

    try {
      const config = this.getRuntimeConfig();
      const priceId = this.priceIdForPlan(config, plan);
      if (!config.paddleClientToken || !priceId) {
        this.checkoutError.set('Checkout ist noch nicht konfiguriert. Bitte pruefe Paddle Token und Preis-ID.');
        return;
      }

      const paddle = await this.loadPaddle();
      if (!paddle) {
        this.checkoutError.set('Checkout konnte nicht geladen werden. Bitte versuche es gleich erneut.');
        return;
      }

      this.initializePaddle(paddle, config);

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { userId: this.auth.user()?.id },
        customer: { email: this.auth.user()?.email },
        settings: { displayMode: 'overlay', theme: 'light', locale: 'de' },
      });
    } catch {
      this.checkoutError.set('Checkout konnte nicht geladen werden. Bitte versuche es gleich erneut.');
    } finally {
      this.checkoutLoading.set(false);
    }
  }

  private getPaddle(): PaddleCheckout | null {
    const candidate = (globalThis as { Paddle?: PaddleCheckout }).Paddle;
    return candidate?.Checkout?.open ? candidate : null;
  }

  private getRuntimeConfig(): Required<PaddleRuntimeConfig> {
    const overrides = (globalThis as { __LBA_CONFIG__?: PaddleRuntimeConfig }).__LBA_CONFIG__;
    const proMonthly = overrides?.paddlePriceIdProMonthly ?? environment.paddlePriceIdProMonthly ?? overrides?.paddlePriceIdPro ?? environment.paddlePriceIdPro;
    return {
      paddleClientToken: overrides?.paddleClientToken ?? environment.paddleClientToken,
      paddleEnvironment: overrides?.paddleEnvironment ?? environment.paddleEnvironment,
      paddlePriceIdPro: overrides?.paddlePriceIdPro ?? environment.paddlePriceIdPro,
      paddlePriceIdPayPerApp: overrides?.paddlePriceIdPayPerApp ?? environment.paddlePriceIdPayPerApp,
      paddlePriceIdProMonthly: proMonthly,
      paddlePriceIdProYearly: overrides?.paddlePriceIdProYearly ?? environment.paddlePriceIdProYearly,
    };
  }

  private priceIdForPlan(config: Required<PaddleRuntimeConfig>, plan: CheckoutPlan): string {
    if (plan === 'payPerApp') return config.paddlePriceIdPayPerApp;
    if (plan === 'proYearly') return config.paddlePriceIdProYearly;
    return config.paddlePriceIdProMonthly;
  }

  private async loadPaddle(): Promise<PaddleCheckout | null> {
    const existing = this.getPaddle();
    if (existing) return existing;
    if (typeof document === 'undefined') return null;

    let script = document.getElementById(PADDLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = PADDLE_SCRIPT_ID;
      script.src = PADDLE_SCRIPT_SRC;
      script.async = true;
      const createdScript = script;
      createdScript.addEventListener('load', () => { createdScript.dataset['loaded'] = 'true'; }, { once: true });
      document.head.appendChild(script);
    }
    if (script.dataset['loaded'] === 'true') return this.getPaddle();

    await new Promise<void>((resolve, reject) => {
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Paddle script failed')), { once: true });
    });

    return this.getPaddle();
  }

  private initializePaddle(paddle: PaddleCheckout, config: Required<PaddleRuntimeConfig>): void {
    if (this.paddleInitialized) return;
    if (config.paddleEnvironment === 'sandbox') {
      paddle.Environment?.set('sandbox');
    }
    paddle.Initialize({
      token: config.paddleClientToken,
      checkout: {
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'de',
        },
      },
    });
    this.paddleInitialized = true;
  }
}
