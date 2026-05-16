# Landing Page Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone `/faq` page with a landing-page FAQ section, add working Hilfe-Center and Bewerbungs-Guide modals to the footer, remove the dead Changelog link, and update legal-page card styling to match Phase 1.

**Architecture:** `FaqSectionComponent` is a new dumb section component in `features/landing/sections/` — it owns accordion state locally and renders all 8 FAQ items. The footer becomes slightly smarter by adding two `signal(false)` values for modal visibility. Legal page styling is a pure CSS change in the shared `legal.component.scss`. FAQ LD+JSON schema moves from the deleted `FaqComponent` into `LandingComponent`.

**Tech Stack:** Angular 21 (standalone, signals, OnPush), Jest (jest-preset-angular), TypeScript

**Dependency:** Phase 1 design system must be implemented first — this plan uses `.page-header`, `.page-title`, `.page-sub` global CSS classes added in that phase.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `features/landing/sections/faq-section.component.ts` | Accordion state + component class |
| Create | `features/landing/sections/faq-section.component.html` | 8 FAQ items in 3 grouped sections |
| Create | `features/landing/sections/faq-section.component.scss` | FAQ list, item, question, answer styles |
| Create | `features/landing/sections/faq-section.component.spec.ts` | Accordion behaviour tests |
| Modify | `features/landing/landing.component.ts` | Add FaqSectionComponent import + LD+JSON injection |
| Modify | `features/landing/landing.component.html` | Add `<section id="faq">` between pricing and CTA |
| Modify | `features/landing/landing.component.spec.ts` | Add `lba-faq-section` assertion |
| Modify | `shared/components/footer.component.ts` | Add `hilfeOffen` + `guideOffen` signals |
| Modify | `shared/components/footer.component.html` | Replace dead links, add modals, remove Changelog |
| Modify | `shared/components/footer.component.scss` | Add modal + footer__text-btn styles |
| Modify | `features/legal/legal.component.scss` | Swap border+bg-2 to surface+shadow-md |
| Modify | `app.routes.ts` | Remove `/faq` route |
| Delete | `features/faq/faq.component.ts` | Route removed, content migrated |
| Delete | `features/faq/faq.component.html` | Content migrated |
| Delete | `features/faq/faq.component.scss` | No longer needed |
| Delete | `features/faq/faq.component.spec.ts` | No longer needed |

---

### Task 0: Create FaqSectionComponent

**Files:**
- Create: `frontend/src/app/features/landing/sections/faq-section.component.ts`
- Create: `frontend/src/app/features/landing/sections/faq-section.component.html`
- Create: `frontend/src/app/features/landing/sections/faq-section.component.scss`
- Create: `frontend/src/app/features/landing/sections/faq-section.component.spec.ts`

- [ ] **Step 0.1: Generate the component via CLI**

```bash
cd frontend
ng generate component features/landing/sections/faq-section --standalone
```

Expected: four files created in `src/app/features/landing/sections/faq-section/` — move them flat into `sections/` if the CLI creates a subdirectory:
```bash
mv src/app/features/landing/sections/faq-section/faq-section.component.ts src/app/features/landing/sections/
mv src/app/features/landing/sections/faq-section/faq-section.component.html src/app/features/landing/sections/
mv src/app/features/landing/sections/faq-section/faq-section.component.scss src/app/features/landing/sections/
mv src/app/features/landing/sections/faq-section/faq-section.component.spec.ts src/app/features/landing/sections/
rmdir src/app/features/landing/sections/faq-section
```

- [ ] **Step 0.2: Write the failing tests**

Replace `frontend/src/app/features/landing/sections/faq-section.component.spec.ts` with:

```typescript
import { TestBed } from '@angular/core/testing';
import { FaqSectionComponent } from './faq-section.component';

describe('FaqSectionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqSectionComponent],
    }).compileComponents();
  });

  it('renders the FAQ heading', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#faq-heading').textContent).toContain('Häufige Fragen');
  });

  it('renders 8 FAQ question buttons', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.faq-item__question');
    expect(buttons.length).toBe(8);
  });

  it('all answers are hidden initially', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const answers = fixture.nativeElement.querySelectorAll('.faq-item__answer');
    for (const answer of Array.from(answers) as HTMLElement[]) {
      expect(answer.hidden).toBe(true);
    }
  });

  it('all buttons have aria-expanded="false" initially', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.faq-item__question');
    for (const btn of Array.from(buttons) as HTMLButtonElement[]) {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('clicking a question reveals its answer', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('#faq-q1-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const answer = fixture.nativeElement.querySelector('#faq-q1') as HTMLElement;
    expect(answer.hidden).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking the same question again collapses it', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('#faq-q1-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    const answer = fixture.nativeElement.querySelector('#faq-q1') as HTMLElement;
    expect(answer.hidden).toBe(true);
  });

  it('opening a second question collapses the first', () => {
    const fixture = TestBed.createComponent(FaqSectionComponent);
    fixture.detectChanges();
    const btn1 = fixture.nativeElement.querySelector('#faq-q1-btn') as HTMLButtonElement;
    const btn2 = fixture.nativeElement.querySelector('#faq-q2-btn') as HTMLButtonElement;
    btn1.click();
    fixture.detectChanges();
    btn2.click();
    fixture.detectChanges();
    const answer1 = fixture.nativeElement.querySelector('#faq-q1') as HTMLElement;
    const answer2 = fixture.nativeElement.querySelector('#faq-q2') as HTMLElement;
    expect(answer1.hidden).toBe(true);
    expect(answer2.hidden).toBe(false);
  });
});
```

- [ ] **Step 0.3: Run tests — verify they fail**

```bash
cd frontend
npm test -- --testPathPattern="faq-section" --watchAll=false
```

Expected: FAIL (component not implemented yet).

- [ ] **Step 0.4: Implement the component class**

Replace `frontend/src/app/features/landing/sections/faq-section.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'lba-faq-section',
  standalone: true,
  imports: [],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSectionComponent {
  protected readonly expandedId = signal<string | null>(null);

  protected toggle(id: string): void {
    this.expandedId.update(current => current === id ? null : id);
  }
}
```

- [ ] **Step 0.5: Implement the template**

Replace `frontend/src/app/features/landing/sections/faq-section.component.html` with:

```html
<div class="page-header faq-section__header">
  <div class="page-header__text">
    <h2 class="page-title" id="faq-heading">Häufige Fragen</h2>
    <p class="page-sub">Antworten auf die häufigsten Fragen zu Hireflow AI</p>
  </div>
</div>

<dl class="faq-list" aria-labelledby="faq-heading">

  <p class="faq-category">Allgemein</p>

  <div class="faq-item">
    <dt>
      <button id="faq-q1-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q1'"
        aria-controls="faq-q1"
        (click)="toggle('q1')">
        Was ist Hireflow AI?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q1' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q1" class="faq-item__answer" [hidden]="expandedId() !== 'q1'">
      Hireflow AI ist ein KI-gestütztes Tool, das deinen Lebenslauf automatisch auf jede Stellenanzeige
      optimiert und ein passendes Anschreiben generiert. Du kannst eine Stelle per Text oder URL eingeben und
      erhältst in Sekunden bewerbungsfertige Unterlagen.
    </dd>
  </div>

  <div class="faq-item">
    <dt>
      <button id="faq-q2-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q2'"
        aria-controls="faq-q2"
        (click)="toggle('q2')">
        Wie lange dauert die Optimierung?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q2' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q2" class="faq-item__answer" [hidden]="expandedId() !== 'q2'">
      Die KI-Optimierung dauert in der Regel 30–60 Sekunden. Während der Generierung kannst du den Fortschritt
      live verfolgen. Die Ergebnisse werden sofort gespeichert und stehen danach dauerhaft zur Verfügung.
    </dd>
  </div>

  <div class="faq-item">
    <dt>
      <button id="faq-q3-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q3'"
        aria-controls="faq-q3"
        (click)="toggle('q3')">
        Welche Dateiformate kann ich hochladen?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q3' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q3" class="faq-item__answer" [hidden]="expandedId() !== 'q3'">
      Wir akzeptieren <strong>PDF</strong> und <strong>DOCX</strong>. Die Datei wird ausschließlich im
      Arbeitsspeicher verarbeitet und nie dauerhaft gespeichert. Die maximale Dateigröße beträgt 10 MB.
    </dd>
  </div>

  <p class="faq-category">Datenschutz &amp; Sicherheit</p>

  <div class="faq-item">
    <dt>
      <button id="faq-q4-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q4'"
        aria-controls="faq-q4"
        (click)="toggle('q4')">
        Wird mein Lebenslauf gespeichert oder weitergegeben?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q4' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q4" class="faq-item__answer" [hidden]="expandedId() !== 'q4'">
      Hochgeladene und generierte Dokumente werden <strong>nie dauerhaft auf der Festplatte gespeichert</strong>.
      Die Verarbeitung findet ausschließlich im RAM statt. Strukturierte Daten (z. B. Berufserfahrung, Skills)
      werden verschlüsselt in deinem Account gespeichert. Du kannst alle Daten jederzeit über den
      DSGVO-Export herunterladen oder vollständig löschen.
    </dd>
  </div>

  <div class="faq-item">
    <dt>
      <button id="faq-q5-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q5'"
        aria-controls="faq-q5"
        (click)="toggle('q5')">
        Ist der Dienst DSGVO-konform?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q5' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q5" class="faq-item__answer" [hidden]="expandedId() !== 'q5'">
      Ja. Hireflow AI wird in Deutschland betrieben und verarbeitet Daten nach Art. 6 Abs. 1 lit. b
      und lit. a DSGVO. Sensible Profildaten (Art. 9) werden nur mit expliziter Einwilligung verarbeitet.
      KI-Anfragen werden mit Pseudonymisierungsdelimitern gesendet, und wir haben Auftragsverarbeitungsverträge
      (AVVs) mit allen externen Dienstleistern abgeschlossen.
    </dd>
  </div>

  <div class="faq-item">
    <dt>
      <button id="faq-q6-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q6'"
        aria-controls="faq-q6"
        (click)="toggle('q6')">
        Wie melde ich eine Sicherheitslücke?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q6' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q6" class="faq-item__answer" [hidden]="expandedId() !== 'q6'">
      Verantwortungsvolle Offenlegungen bitte per E-Mail an
      <a href="/.well-known/security.txt" rel="noopener">security.txt lesen</a> oder direkt an
      <a href="mailto:security@lebenslauf-agent.de">security@lebenslauf-agent.de</a>.
      Wir bestätigen den Eingang innerhalb von 48 Stunden.
    </dd>
  </div>

  <p class="faq-category">Preise &amp; Abrechnung</p>

  <div class="faq-item">
    <dt>
      <button id="faq-q7-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q7'"
        aria-controls="faq-q7"
        (click)="toggle('q7')">
        Wie viele Bewerbungen kann ich kostenlos erstellen?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q7' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q7" class="faq-item__answer" [hidden]="expandedId() !== 'q7'">
      Neue Accounts erhalten <strong>eine kostenlose Testbewerbung</strong> ohne Kreditkarte. Danach kannst du
      entweder einzelne Bewerbungen im Pay-per-App-Modell kaufen oder auf den Pro-Plan upgraden, der
      unbegrenzte Bewerbungen enthält.
    </dd>
  </div>

  <div class="faq-item">
    <dt>
      <button id="faq-q8-btn" type="button" class="faq-item__question"
        [attr.aria-expanded]="expandedId() === 'q8'"
        aria-controls="faq-q8"
        (click)="toggle('q8')">
        Kann ich das Pro-Abo jederzeit kündigen?
        <span class="faq-item__icon" aria-hidden="true">{{ expandedId() === 'q8' ? '−' : '+' }}</span>
      </button>
    </dt>
    <dd id="faq-q8" class="faq-item__answer" [hidden]="expandedId() !== 'q8'">
      Ja. Pro-Abos können jederzeit über das Kundenportal gekündigt werden. Du behältst den Zugang bis zum Ende
      des bezahlten Zeitraums. Eine Kündigung ist ohne Angabe von Gründen möglich.
    </dd>
  </div>

</dl>
```

- [ ] **Step 0.6: Implement the styles**

Replace `frontend/src/app/features/landing/sections/faq-section.component.scss` with:

```scss
:host {
  display: block;
  padding: var(--space-16) var(--space-8);
  max-width: 800px;
  margin-inline: auto;
}

.faq-section__header {
  margin-bottom: var(--space-6);
}

.faq-category {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-3);
  margin: var(--space-6) 0 var(--space-2);
}

.faq-category:first-of-type {
  margin-top: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
}

.faq-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.faq-item__question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  min-height: 44px;

  &:hover {
    background: var(--surface-2);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
}

.faq-item__icon {
  font-size: 18px;
  color: var(--ink-3);
  flex-shrink: 0;
  line-height: 1;
}

.faq-item__answer {
  padding: 0 var(--space-5) var(--space-4);
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.7;

  a {
    color: var(--accent);
    font-weight: 600;
  }

  strong {
    color: var(--ink);
  }

  &[hidden] {
    display: none;
  }
}
```

- [ ] **Step 0.7: Run tests — verify they pass**

```bash
cd frontend
npm test -- --testPathPattern="faq-section" --watchAll=false
```

Expected: all 7 tests PASS.

- [ ] **Step 0.8: Commit**

```bash
cd frontend
git add src/app/features/landing/sections/faq-section.component.ts src/app/features/landing/sections/faq-section.component.html src/app/features/landing/sections/faq-section.component.scss src/app/features/landing/sections/faq-section.component.spec.ts
git commit -m "feat: add FaqSectionComponent with signal-based accordion"
```

---

### Task 1: Wire FaqSectionComponent into LandingComponent

**Files:**
- Modify: `frontend/src/app/features/landing/landing.component.ts`
- Modify: `frontend/src/app/features/landing/landing.component.html`
- Modify: `frontend/src/app/features/landing/landing.component.spec.ts`

- [ ] **Step 1.1: Update LandingComponent class**

Replace `frontend/src/app/features/landing/landing.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
import { FaqSectionComponent } from './sections/faq-section.component';
import { FeaturesGridComponent } from './sections/features-grid.component';
import { HeroComponent } from './sections/hero.component';
import { LogoBarComponent } from './sections/logo-bar.component';
import { PricingInlineComponent } from './sections/pricing-inline.component';
import { TestimonialsComponent } from './sections/testimonials.component';
import { WorkflowStepsComponent } from './sections/workflow-steps.component';

type LandingDialog = 'try' | 'login' | 'register';
type TryDialogStep = 'cv' | 'job' | 'result';

const FAQ_LD_JSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Was ist Hireflow AI?',
      acceptedAnswer: { '@type': 'Answer', text: 'Hireflow AI ist ein KI-gestütztes Tool, das deinen Lebenslauf automatisch auf jede Stellenanzeige optimiert und ein passendes Anschreiben generiert.' },
    },
    {
      '@type': 'Question',
      name: 'Ist der Dienst DSGVO-konform?',
      acceptedAnswer: { '@type': 'Answer', text: 'Ja. Hireflow AI wird in Deutschland betrieben und verarbeitet Daten nach DSGVO. Dateien werden nie dauerhaft gespeichert.' },
    },
    {
      '@type': 'Question',
      name: 'Wie viele Bewerbungen kann ich kostenlos erstellen?',
      acceptedAnswer: { '@type': 'Answer', text: 'Neue Accounts erhalten eine kostenlose Testbewerbung ohne Kreditkarte.' },
    },
  ],
});

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
    FaqSectionComponent,
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
      'Hireflow AI optimiert deinen Lebenslauf auf jede Stelle und schreibt ein passendes Anschreiben – in weniger als einer Minute.',
      '/',
    );
    this.applyAuthQuery();

    const document = inject(DOCUMENT);
    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.textContent = FAQ_LD_JSON;
    document.head.appendChild(ldScript);
    inject(DestroyRef).onDestroy(() => ldScript.remove());
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
      this.modalMessage.set('E-Mail bestätigt. Du kannst dich jetzt anmelden.');
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
```

- [ ] **Step 1.2: Update landing.component.html — add FAQ section**

In `frontend/src/app/features/landing/landing.component.html`, insert the `<section id="faq">` block between `<div id="preise">` and `<lba-cta-band>`. The full updated file:

```html
<lba-navbar (loginRequested)="openDialog('login')" (registerRequested)="openDialog('register')" />

<main id="main">
  <lba-hero (optimizeRequested)="openDialog('try')" />
  <lba-logo-bar />

  <section id="features" aria-labelledby="features-heading">
    <lba-features-grid />
  </section>

  <section id="workflow" aria-labelledby="workflow-heading">
    <lba-workflow-steps />
  </section>

  <section id="beispiel" aria-labelledby="beispiel-heading">
    <lba-before-after />
  </section>

  <lba-testimonials />

  <div id="preise">
    <lba-pricing-inline (singleRequested)="openDialog('try')" (proRequested)="openDialog('register')" />
  </div>

  <section id="faq" aria-labelledby="faq-heading">
    <lba-faq-section />
  </section>

  <lba-cta-band (optimizeRequested)="openDialog('try')" (demoRequested)="openDialog('try')" />
</main>

<lba-footer />

@if (activeDialog(); as dialog) {
  <div class="modal-backdrop" role="presentation" (click)="handleBackdropClick(dialog)" (keydown.escape)="closeDialog()" tabindex="-1">
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="dialog + '-dialog-title'"
      (click)="$event.stopPropagation()"
    >
      <button type="button" class="modal__close" aria-label="Dialog schließen" (click)="closeDialog()">×</button>

      @switch (dialog) {
        @case ('try') {
          <div class="modal__header">
            <p class="eyebrow">Live Optimierung</p>
            <h2 id="try-dialog-title">Bewerbung optimieren</h2>
            <p>Teste den Ablauf direkt hier, ohne die Landingpage zu verlassen.</p>
          </div>

          <div class="steps" aria-label="Optimierungsfortschritt">
            <span [class.is-active]="tryStep() === 'cv'">1 CV</span>
            <span [class.is-active]="tryStep() === 'job'">2 Stelle</span>
            <span [class.is-active]="tryStep() === 'result'">3 Match</span>
          </div>

          @if (tryStep() === 'cv') {
            <label class="field">
              <span>Lebenslauf einfügen</span>
              <textarea
                name="cvText"
                rows="8"
                [value]="cvText()"
                (input)="cvText.set($any($event.target).value)"
                placeholder="Kurzprofil, Erfahrung, Skills und relevante Projekte…"
              ></textarea>
            </label>
            <button type="button" class="btn btn--primary btn--md" [disabled]="!canContinueCv()" (click)="continueToJob()">
              Weiter zur Stellenanzeige
            </button>
          }

          @if (tryStep() === 'job') {
            <label class="field">
              <span>Stellenanzeige einfügen</span>
              <textarea
                name="jobText"
                rows="8"
                [value]="jobText()"
                (input)="jobText.set($any($event.target).value)"
                placeholder="Rolle, Aufgaben, Anforderungen, gewünschte Keywords…"
              ></textarea>
            </label>
            <div class="modal__actions">
              <button type="button" class="btn btn--ghost btn--md" (click)="tryStep.set('cv')">Zurück</button>
              <button
                type="button"
                class="btn btn--primary btn--md"
                [disabled]="!canRunOptimization() || trialLoading()"
                (click)="runOptimization()"
              >
                {{ trialLoading() ? 'Wird berechnet…' : 'Match berechnen' }}
              </button>
            </div>
            @if (trialError()) {
              <p class="modal__error" role="alert">{{ trialError() }}</p>
            }
          }

          @if (tryStep() === 'result') {
            <div class="result-panel">
              <span>Match-Score</span>
              <strong>{{ matchScore() }}%</strong>
              @if (trialResult(); as result) {
                <p>{{ result.summary }}</p>
                <div class="keyword-cloud" aria-label="Keyword-Auswertung">
                  @for (keyword of result.keywordMatches; track keyword.keyword) {
                    <span [class.is-missing]="!keyword.matched">{{ keyword.keyword }}</span>
                  }
                </div>
                <ul>
                  @for (suggestion of result.suggestions; track suggestion) {
                    <li>{{ suggestion }}</li>
                  }
                </ul>
              }
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--ghost btn--md" (click)="tryStep.set('job')">Anpassen</button>
              <button type="button" class="btn btn--primary btn--md" (click)="openDialog('register')">
                Kostenlos starten
              </button>
            </div>
          }
        }

        @case ('login') {
          <div class="modal__header">
            <p class="eyebrow">Willkommen zurück</p>
            <h2 id="login-dialog-title">Anmelden</h2>
            <p>Mit deinem Konto gelangst du direkt in den Bewerbungsbereich.</p>
          </div>

          <form class="modal-form" (submit)="$event.preventDefault(); submitLogin()">
            <label class="field">
              <span>E-Mail</span>
              <input
                name="loginEmail"
                type="email"
                autocomplete="email"
                [value]="loginEmail()"
                (input)="loginEmail.set($any($event.target).value)"
              />
            </label>
            <label class="field">
              <span>Passwort</span>
              <input
                name="loginPassword"
                type="password"
                autocomplete="current-password"
                [value]="loginPassword()"
                (input)="loginPassword.set($any($event.target).value)"
              />
            </label>
            <label class="field">
              <span>2FA-Code</span>
              <small>Nur ausfüllen, wenn Zwei-Faktor-Auth aktiv ist.</small>
              <input
                name="loginTotp"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                pattern="[0-9]{6}"
                [value]="loginTotp()"
                (input)="loginTotp.set($any($event.target).value)"
              />
            </label>
            <button type="submit" class="btn btn--primary btn--md" [disabled]="!canSubmitLogin() || authLoading()">
              {{ authLoading() ? 'Anmeldung läuft…' : 'Anmelden' }}
            </button>
          </form>

          <button type="button" class="modal__switch" (click)="openDialog('register')">Noch keinen Account? Kostenlos starten</button>
        }

        @case ('register') {
          <div class="modal__header">
            <p class="eyebrow">Kostenlos starten</p>
            <h2 id="register-dialog-title">Account erstellen</h2>
            <p>Nach der Registrierung bestätigst du deine E-Mail-Adresse und kannst dich einloggen.</p>
          </div>

          <form class="modal-form" (submit)="$event.preventDefault(); submitRegister()">
            <label class="field">
              <span>Name</span>
              <input
                name="registerName"
                autocomplete="name"
                [value]="registerName()"
                (input)="registerName.set($any($event.target).value)"
              />
            </label>
            <label class="field">
              <span>E-Mail</span>
              <input
                name="registerEmail"
                type="email"
                autocomplete="email"
                [value]="registerEmail()"
                (input)="registerEmail.set($any($event.target).value)"
              />
            </label>
            <label class="field">
              <span>Passwort</span>
              <small>Mindestens 12 Zeichen</small>
              <input
                name="registerPassword"
                type="password"
                autocomplete="new-password"
                [value]="registerPassword()"
                (input)="registerPassword.set($any($event.target).value)"
              />
            </label>
            <label class="check-field">
              <input
                name="consentGiven"
                type="checkbox"
                [checked]="consentGiven()"
                (change)="consentGiven.set($any($event.target).checked)"
              />
              <span>Ich stimme der Verarbeitung meiner Bewerbungsdaten für diesen Test zu.</span>
            </label>
            <button type="submit" class="btn btn--primary btn--md" [disabled]="!canSubmitRegister() || authLoading()">
              {{ authLoading() ? 'Account wird erstellt…' : 'Account erstellen' }}
            </button>
          </form>

          <button type="button" class="modal__switch" (click)="openDialog('login')">Ich habe schon einen Account</button>
        }
      }

      @if (modalMessage()) {
        <p class="modal__message" role="alert" aria-live="polite">{{ modalMessage() }}</p>
      }
    </section>
  </div>
}
```

- [ ] **Step 1.3: Update landing.component.spec.ts — add FAQ section assertion**

In `frontend/src/app/features/landing/landing.component.spec.ts`, add to the `'should compose all landing sections'` test (after the `lba-pricing-inline` assertion):

```typescript
expect(fixture.nativeElement.querySelector('lba-faq-section')).toBeTruthy();
```

The full updated test:

```typescript
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
  expect(fixture.nativeElement.querySelector('lba-faq-section')).toBeTruthy();
  expect(fixture.nativeElement.querySelector('lba-cta-band')).toBeTruthy();
  expect(fixture.nativeElement.querySelector('lba-footer')).toBeTruthy();
});
```

- [ ] **Step 1.4: Run tests — verify landing suite passes**

```bash
cd frontend
npm test -- --testPathPattern="landing.component" --watchAll=false
```

Expected: all existing tests PASS plus the new `lba-faq-section` assertion.

- [ ] **Step 1.5: Commit**

```bash
cd frontend
git add src/app/features/landing/landing.component.ts src/app/features/landing/landing.component.html src/app/features/landing/landing.component.spec.ts
git commit -m "feat: wire FaqSectionComponent into landing page with FAQPage LD+JSON"
```

---

### Task 2: Footer modals

**Files:**
- Modify: `frontend/src/app/shared/components/footer.component.ts`
- Modify: `frontend/src/app/shared/components/footer.component.html`
- Modify: `frontend/src/app/shared/components/footer.component.scss`

- [ ] **Step 2.1: Update FooterComponent class**

Replace `frontend/src/app/shared/components/footer.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../core/consent/consent.service';

@Component({
  selector: 'lba-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly consent = inject(ConsentService);
  protected readonly hilfeOffen = signal(false);
  protected readonly guideOffen = signal(false);
}
```

- [ ] **Step 2.2: Update footer.component.html**

Replace `frontend/src/app/shared/components/footer.component.html` with:

```html
<footer class="footer" aria-label="Seitenfuß">
  <div class="footer__inner">
    <div class="footer__brand">
      <div class="footer__brandline">
        <span class="footer__name">Hireflow AI</span>
      </div>
      <p class="footer__tagline">
        KI-gestützte Bewerbungen für Studenten, Junior-Devs und Berufseinsteiger. Made in Heidelberg.
      </p>
    </div>

    <nav class="footer__cols" aria-label="Footer-Navigation">
      <div class="footer__col">
        <h3 class="footer__col-heading">PRODUKT</h3>
        <a href="#features">Features</a>
        <a href="#workflow">So funktioniert's</a>
        <a href="#preise">Preise</a>
      </div>
      <div class="footer__col">
        <h3 class="footer__col-heading">RESSOURCEN</h3>
        <a href="/#faq">FAQ</a>
        <button type="button" class="footer__text-btn" (click)="guideOffen.set(true)">Bewerbungs-Guide</button>
        <button type="button" class="footer__text-btn" (click)="hilfeOffen.set(true)">Hilfe-Center</button>
      </div>
      <div class="footer__col">
        <h3 class="footer__col-heading">RECHTLICHES</h3>
        <a routerLink="/datenschutz">Datenschutz</a>
        <a routerLink="/agb">AGB</a>
        <a routerLink="/impressum">Impressum</a>
        <a href="/.well-known/security.txt" rel="noopener">Sicherheit</a>
      </div>
    </nav>
  </div>

  <div class="footer__bar">
    <span>© 2026 Hireflow AI</span>
    <button
      type="button"
      class="footer__cookie-settings"
      (click)="consent.openSettings()"
      aria-label="Cookie-Einstellungen öffnen"
    >Cookie-Einstellungen</button>
    <span>v 0.4.2 · Beta</span>
  </div>
</footer>

@if (guideOffen()) {
  <div class="modal-backdrop" role="presentation"
    (click)="guideOffen.set(false)"
    (keydown.escape)="guideOffen.set(false)"
    tabindex="-1">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="guide-title"
      (click)="$event.stopPropagation()">
      <button type="button" class="modal__close" aria-label="Schließen" (click)="guideOffen.set(false)">×</button>
      <div class="modal__header">
        <h2 id="guide-title">Bewerbungs-Guide</h2>
        <p>Deine Bewerbung in 5 Schritten</p>
      </div>
      <ol class="guide-steps">
        <li>Lebenslauf hochladen oder als Text einfügen</li>
        <li>Stellenanzeige per Text oder URL angeben</li>
        <li>KI-Optimierung starten und Match-Score prüfen</li>
        <li>Anschreiben generieren und anpassen</li>
        <li>Unterlagen als PDF exportieren und einreichen</li>
      </ol>
    </section>
  </div>
}

@if (hilfeOffen()) {
  <div class="modal-backdrop" role="presentation"
    (click)="hilfeOffen.set(false)"
    (keydown.escape)="hilfeOffen.set(false)"
    tabindex="-1">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="hilfe-title"
      (click)="$event.stopPropagation()">
      <button type="button" class="modal__close" aria-label="Schließen" (click)="hilfeOffen.set(false)">×</button>
      <div class="modal__header">
        <h2 id="hilfe-title">Hilfe-Center</h2>
        <p>Wie können wir helfen?</p>
      </div>
      <ul class="hilfe-list">
        <li><a href="mailto:hi@hireflow.ai">Schreib uns: hi@hireflow.ai</a></li>
        <li><a href="/#faq" (click)="hilfeOffen.set(false)">Häufige Fragen ansehen</a></li>
        <li><a href="mailto:security@hireflow.ai">Sicherheitslücke melden</a></li>
      </ul>
    </section>
  </div>
}
```

- [ ] **Step 2.3: Add modal styles to footer.component.scss**

Append to the end of `frontend/src/app/shared/components/footer.component.scss`:

```scss
.footer__text-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 14px;
  color: var(--ink-2);
  cursor: pointer;
  text-align: left;
  width: fit-content;

  &:hover {
    color: var(--ink);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: rgba(15, 18, 32, 0.5);
  backdrop-filter: blur(8px);
}

.modal {
  position: relative;
  width: min(100%, 480px);
  padding: var(--space-8);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--ink-2);
  font: inherit;
  font-size: 20px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;

  &:hover {
    background: var(--surface-2);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
}

.modal__header {
  margin-bottom: var(--space-5);
  padding-right: var(--space-8);

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: var(--space-1);
  }

  p {
    font-size: 13px;
    color: var(--ink-3);
  }
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-left: var(--space-5);
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.6;
}

.hilfe-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-left: var(--space-5);
  font-size: 14px;

  a {
    color: var(--accent);
    font-weight: 600;

    &:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
}
```

- [ ] **Step 2.4: Run lint to catch any template issues**

```bash
cd frontend
npm run lint
```

Expected: exit 0.

- [ ] **Step 2.5: Commit**

```bash
cd frontend
git add src/app/shared/components/footer.component.ts src/app/shared/components/footer.component.html src/app/shared/components/footer.component.scss
git commit -m "feat: add Bewerbungs-Guide and Hilfe-Center modals to footer"
```

---

### Task 3: Cleanup — remove FAQ route, delete FaqComponent, fix legal styles

**Files:**
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/features/legal/legal.component.scss`
- Delete: `frontend/src/app/features/faq/` (all 4 files)

- [ ] **Step 3.1: Remove the /faq route**

Replace `frontend/src/app/app.routes.ts` with:

```typescript
import type { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
  // Marketing
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'preise', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'try', loadComponent: () => import('./features/try/try.component').then(m => m.TryComponent) },

  // Auth
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },

  // App (authenticated)
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AppShellComponent,
        children: [
          { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'cvs', loadComponent: () => import('./features/master-cvs/master-cvs.component').then(m => m.MasterCvsComponent) },
          { path: 'billing', loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent) },
          { path: 'wizard', loadComponent: () => import('./features/wizard/wizard.component').then(m => m.WizardComponent) },
          { path: 'security', loadComponent: () => import('./features/security/security.component').then(m => m.SecurityComponent) },
          { path: 'linkedin', loadComponent: () => import('./features/linkedin/linkedin.component').then(m => m.LinkedInComponent) },
        ],
      },
      // Editor: full-screen, no shell
      { path: 'applications/:id', loadComponent: () => import('./features/application-editor/editor.component').then(m => m.EditorComponent) },
    ],
  },

  // Legal
  { path: 'datenschutz', loadComponent: () => import('./features/legal/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'agb', loadComponent: () => import('./features/legal/terms.component').then(m => m.TermsComponent) },
  { path: 'impressum', loadComponent: () => import('./features/legal/imprint.component').then(m => m.ImprintComponent) },

  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
```

- [ ] **Step 3.2: Delete the FaqComponent files**

```bash
cd frontend
rm src/app/features/faq/faq.component.ts
rm src/app/features/faq/faq.component.html
rm src/app/features/faq/faq.component.scss
rm src/app/features/faq/faq.component.spec.ts
rmdir src/app/features/faq
```

- [ ] **Step 3.3: Fix legal page card styling**

In `frontend/src/app/features/legal/legal.component.scss`, update the section style block.

Find and replace this block:

```scss
.legal-page__content section {
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-2);
}
```

Replace with:

```scss
.legal-page__content section {
  padding: var(--space-6);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}
```

- [ ] **Step 3.4: Run full test suite — verify nothing is broken**

```bash
cd frontend
npm test -- --watchAll=false
```

Expected: all tests PASS. There should be no remaining references to `FaqComponent` since the route and imports are gone.

- [ ] **Step 3.5: Commit**

```bash
cd frontend
git add src/app/app.routes.ts src/app/features/legal/legal.component.scss
git rm src/app/features/faq/faq.component.ts src/app/features/faq/faq.component.html src/app/features/faq/faq.component.scss src/app/features/faq/faq.component.spec.ts
git commit -m "chore: remove /faq route and FaqComponent, fix legal card styling"
```

---

### Task 4: Verification

- [ ] **Step 4.1: Lint**

```bash
cd frontend
npm run lint
```

Expected: exit 0.

- [ ] **Step 4.2: Full test suite**

```bash
cd frontend
npm test -- --watchAll=false
```

Expected: exit 0, all tests pass.

- [ ] **Step 4.3: Build**

```bash
cd frontend
npm run build
```

Expected: exit 0, no errors.

- [ ] **Step 4.4: Manual checks**

1. Open landing page — scroll down: FAQ section visible between pricing and CTA band
2. Click a FAQ question — answer expands; icon changes from `+` to `−`
3. Click a second question — first collapses, second expands
4. Footer: click "Bewerbungs-Guide" — modal opens with 5-step list
5. Press Escape — modal closes
6. Footer: click "Hilfe-Center" — modal opens with contact + FAQ + security links
7. Click backdrop — modal closes
8. Footer: "Changelog" link is gone; "FAQ" link scrolls to `#faq` section on landing page
9. Navigate to `/agb`, `/datenschutz`, `/impressum` — sections render with shadow (not flat border)
10. Navigate to `/faq` — redirects to landing page (handled by `**` wildcard to not-found or landing)
