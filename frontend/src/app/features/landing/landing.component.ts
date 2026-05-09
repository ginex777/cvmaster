import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrialApiService } from '../../core/api/trial.service';
import type { TrialResponse } from '../../core/api/trial.service';
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
    FormsModule,
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
  protected readonly registerName = signal('');
  protected readonly registerEmail = signal('');
  protected readonly registerPassword = signal('');
  protected readonly consentGiven = signal(false);
  protected readonly modalMessage = signal('');

  protected readonly canContinueCv = computed(() => this.cvText().trim().length >= 40);
  protected readonly canRunOptimization = computed(
    () => this.canContinueCv() && this.jobText().trim().length >= 40,
  );
  protected readonly canSubmitLogin = computed(
    () => this.loginEmail().trim().length > 3 && this.loginPassword().trim().length >= 6,
  );
  protected readonly canSubmitRegister = computed(
    () =>
      this.registerName().trim().length > 1 &&
      this.registerEmail().trim().length > 3 &&
      this.registerPassword().trim().length >= 8 &&
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

  protected submitLogin(): void {
    if (!this.canSubmitLogin()) {
      return;
    }

    this.modalMessage.set('Anmeldung vorbereitet. Die echte Authentifizierung bleibt im nächsten Schritt anbindbar.');
  }

  protected submitRegister(): void {
    if (!this.canSubmitRegister()) {
      return;
    }

    this.modalMessage.set('Account-Start vorbereitet. Der Flow bleibt im Overlay, ohne die Landingpage zu verlassen.');
  }
}
