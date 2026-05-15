import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TrialApiService } from '../../core/api/trial.service';
import type { TrialResponse } from '../../core/api/trial.service';
import { AuthService } from '../../core/auth/auth.service';
import { SeoService } from '../../core/seo/seo.service';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { BeforeAfterComponent } from './sections/before-after.component';
import { CtaBandComponent } from './sections/cta-band.component';
import { FeaturesGridComponent } from './sections/features-grid.component';
import { HeroComponent } from './sections/hero.component';
import { LogoBarComponent } from './sections/logo-bar.component';
import { PricingInlineComponent } from './sections/pricing-inline.component';
import { TestimonialsComponent } from './sections/testimonials.component';
import { WorkflowStepsComponent } from './sections/workflow-steps.component';

type LandingDialog = 'try' | 'login' | 'register';
type TryDialogStep = 'cv' | 'job' | 'result';

@Component({
  selector: 'lba-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    HeroComponent,
    LogoBarComponent,
    FeaturesGridComponent,
    WorkflowStepsComponent,
    BeforeAfterComponent,
    TestimonialsComponent,
    PricingInlineComponent,
    CtaBandComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private readonly trialApi = inject(TrialApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    inject(SeoService).setPage(
      'KI-optimierte Bewerbungsunterlagen',
      'Lebenslauf-Agent optimiert deinen Lebenslauf auf jede Stelle und schreibt ein passendes Anschreiben – in weniger als einer Minute.',
      '/',
    );
    this.applyAuthQuery();
  }

  protected readonly activeDialog = signal<LandingDialog | null>(null);
  protected readonly tryStep = signal<TryDialogStep>('cv');
  protected readonly cvText = signal('');
  protected readonly jobText = signal('');
  protected readonly matchScore = signal(0);
  protected readonly trialLoading = signal(false);
  protected readonly trialError = signal('');
  protected readonly trialResult = signal<TrialResponse | null>(null);
  protected readonly loginEmail = signal('');
  protected readonly loginPassword = signal('');
  protected readonly loginTotp = signal('');
  protected readonly registerName = signal('');
  protected readonly registerEmail = signal('');
  protected readonly registerPassword = signal('');
  protected readonly consentGiven = signal(false);
  protected readonly modalMessage = signal('');
  protected readonly authLoading = signal(false);

  protected readonly canContinueCv = computed(() => this.cvText().trim().length >= 40);
  protected readonly canRunOptimization = computed(
    () => this.canContinueCv() && this.jobText().trim().length >= 40,
  );
  protected readonly canSubmitLogin = computed(
    () =>
      this.loginEmail().trim().length > 3 &&
      this.loginPassword().trim().length >= 6 &&
      (this.loginTotp().trim().length === 0 || /^\d{6}$/.test(this.loginTotp().trim())),
  );
  protected readonly canSubmitRegister = computed(
    () =>
      this.registerName().trim().length > 1 &&
      this.registerEmail().trim().length > 3 &&
      this.registerPassword().trim().length >= 12 &&
      this.consentGiven(),
  );

  protected openDialog(dialog: LandingDialog): void {
    this.activeDialog.set(dialog);
    this.modalMessage.set('');

    if (dialog === 'try') {
      this.tryStep.set('cv');
      this.matchScore.set(0);
      this.trialError.set('');
      this.trialResult.set(null);
    }
  }

  protected closeDialog(): void {
    this.activeDialog.set(null);
    this.modalMessage.set('');
  }

  protected handleBackdropClick(dialog: LandingDialog): void {
    if (dialog === 'try') {
      this.closeDialog();
    }
  }

  private applyAuthQuery(): void {
    const params = this.route.snapshot.queryParamMap;
    const requestedAuth = params.get('auth');

    if (requestedAuth === 'login' || params.get('verified') === '1') {
      this.activeDialog.set('login');
    } else if (requestedAuth === 'register') {
      this.activeDialog.set('register');
    }

    if (params.get('verified') === '1') {
      this.modalMessage.set('E-Mail bestaetigt. Du kannst dich jetzt anmelden.');
    }
  }

  protected continueToJob(): void {
    if (!this.canContinueCv()) {
      return;
    }

    this.tryStep.set('job');
  }

  protected async runOptimization(): Promise<void> {
    if (!this.canRunOptimization()) {
      return;
    }

    this.trialLoading.set(true);
    this.trialError.set('');

    try {
      const result = await this.trialApi.analyze(this.cvText(), this.jobText());
      this.trialResult.set(result);
      this.matchScore.set(result.matchScore);
      this.tryStep.set('result');
    } catch {
      this.trialError.set('Die Optimierung konnte gerade nicht gestartet werden. Bitte prüfe die Texte und versuche es erneut.');
    } finally {
      this.trialLoading.set(false);
    }
  }

  protected async submitLogin(): Promise<void> {
    if (!this.canSubmitLogin()) {
      return;
    }

    this.authLoading.set(true);
    this.modalMessage.set('');

    try {
      await this.auth.login(this.loginEmail().trim(), this.loginPassword(), this.loginTotp().trim() || undefined);
      await this.router.navigate(['/app']);
      this.closeDialog();
    } catch (error: unknown) {
      this.modalMessage.set(this.errorMessage(error, 'Anmeldung fehlgeschlagen.'));
    } finally {
      this.authLoading.set(false);
    }
  }

  protected async submitRegister(): Promise<void> {
    if (!this.canSubmitRegister()) {
      return;
    }

    this.authLoading.set(true);
    this.modalMessage.set('');

    try {
      await this.auth.register({
        name: this.registerName().trim(),
        email: this.registerEmail().trim(),
        password: this.registerPassword(),
        art9Consent: this.consentGiven(),
      });
      this.registerName.set('');
      this.registerEmail.set('');
      this.registerPassword.set('');
      this.consentGiven.set(false);
      this.activeDialog.set('login');
      this.modalMessage.set('Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse und melde dich dann an.');
    } catch (error: unknown) {
      this.modalMessage.set(this.errorMessage(error, 'Registrierung fehlgeschlagen.'));
    } finally {
      this.authLoading.set(false);
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallback;
  }
}
