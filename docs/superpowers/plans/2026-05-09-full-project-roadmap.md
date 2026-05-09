# Lebenslauf-Agent — Full Project Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a fully working Lebenslauf-Agent product end-to-end — marketing, auth, CV upload, AI optimization, editor, PDF export, billing, and GDPR.

**Architecture:** Angular 21 SPA (signals, standalone, OnPush) + NestJS + Prisma + BullMQ. Each task is a complete, independently verifiable feature: backend + frontend + tests + lint + build all pass before moving on.

**Tech Stack:** Angular 21, NestJS 10, Prisma 7, PostgreSQL 16, Redis 7, BullMQ 5, Argon2id, EdDSA JWT, Zod 3, Jest 30, Tailwind 3, Geist font, Paddle (billing), Resend (email), Mistral (AI).

**Definition of Done per task:** backend lint ✓ · backend tests ✓ · frontend lint ✓ · frontend tests ✓ · frontend build ✓

---

## Task Overview

| # | Feature | Deliverable |
|---|---|---|
| 0 | Foundation | DB schema, migrations, Jest migration, PrismaService |
| 1 | Landing page | Full marketing page with all 8 sections, navbar, footer |
| 2 | Register | Backend endpoint + frontend form + email verification |
| 3 | Login | Backend endpoint + frontend form + JWT session |
| 4 | Dashboard | Backend stats endpoint + protected frontend page |
| 5 | Master CV Upload | Backend upload+parse + frontend drag-drop page |
| 6 | Wizard | Backend job-parse + optimize + frontend 3-step wizard |
| 7 | Application Editor | Backend CRUD + frontend 3-panel editor |
| 8 | PDF Export | Backend pdf-lib generation + frontend download button |
| 9 | Pricing + Billing | Backend Paddle webhook + frontend pricing page |
| 10 | Try / Demo | Backend trial endpoint (no auth) + frontend try page |
| 11 | Legal Pages | Datenschutz, AGB, Impressum (static content) |
| 12 | GDPR | Backend export + delete + frontend account settings |
| 13 | Not Found | 404 page |

---

## Task 0 — Foundation

**Goal:** Database schema migrated, Prisma client generated, frontend Jest configured. Nothing functional yet — just the plumbing everything else depends on.

**Files:**
- Create/Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/` (generated)
- Modify: `frontend/package.json`, `frontend/jest.config.ts`, `frontend/setup-jest.ts`, `frontend/tsconfig.spec.json`
- Verify: `backend/src/common/prisma.service.ts`

- [ ] **Step 1: Write the complete Prisma schema**

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Plan {
  FREE
  PRO
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String
  passwordHash     String
  plan             Plan      @default(FREE)
  emailVerifiedAt  DateTime?
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?
  trialUsed        Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  sessions      Session[]
  masterCvs     MasterCv[]
  applications  Application[]
  consents      Consent[]
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  refreshHash String   @unique
  ipHash      String
  userAgent   String
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Consent {
  id        String   @id @default(cuid())
  userId    String
  type      String
  ipHash    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model MasterCv {
  id        String   @id @default(cuid())
  userId    String
  name      String   @default("Master-CV")
  rawText   String
  parsed    Json
  language  String   @default("de")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Application {
  id          String   @id @default(cuid())
  userId      String
  masterCvId  String
  jobTitle    String
  companyName String
  jobRaw      String
  optimizedCv Json
  coverLetter Json
  matchReport Json
  atsScore    Int
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  masterCv MasterCv @relation(fields: [masterCvId], references: [id])
}

model EmailVerification {
  id        String   @id @default(cuid())
  userId    String   @unique
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Run migration and generate client**

```bash
cd backend && npx prisma migrate dev --name init && npm run prisma:generate
```

Expected: `migrations/` folder created, `@prisma/client` generated.

- [ ] **Step 3: Verify PrismaService extends PrismaClient**

```typescript
// backend/src/common/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

Verify `PrismaService` is in `providers` and `exports` of `AppModule` (or a shared `PrismaModule`).

- [ ] **Step 4: Install jest-preset-angular**

```bash
cd frontend && npm install --save-dev jest jest-preset-angular @types/jest ts-jest
```

- [ ] **Step 5: Create jest.config.ts**

```typescript
// frontend/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterFramework: ['<rootDir>/setup-jest.ts'],
  testPathPattern: 'src/.*\\.spec\\.ts$',
  transform: { '^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', { tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: /\.html$/ }] },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main*.ts'],
};

export default config;
```

- [ ] **Step 6: Create setup-jest.ts**

```typescript
// frontend/setup-jest.ts
import 'jest-preset-angular/setup-jest';
```

- [ ] **Step 7: Update tsconfig.spec.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jest"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts", "setup-jest.ts"]
}
```

- [ ] **Step 8: Update frontend/package.json test script**

Change `"test": "ng test"` → `"test": "jest --watchAll=false"` and add `"test:watch": "jest"`.

- [ ] **Step 9: Run verification**

```bash
cd backend && npm run lint
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm test -- --watchAll=false
cd frontend && npm run build
```

All must exit 0.

- [ ] **Step 10: Commit**

```bash
git add backend/prisma/ backend/src/common/ frontend/
git commit -m "chore: init DB schema and migrate frontend tests to Jest"
```

---

## Task 1 — Landing Page

**Goal:** Full marketing page live at `/` — navbar, 8 sections, footer, scroll reveal animations, all CTAs routed correctly.

**Reference:** `docs/superpowers/specs/2026-05-09-landing-page-design.md` — every pixel, copy string, and color value is there. Follow it exactly.

**Files:**
- Modify: `frontend/src/styles.css`
- Create: `frontend/src/app/shared/directives/reveal.directive.{ts,spec.ts}`
- Modify: `frontend/src/app/shared/components/navbar.component.{ts,html,scss,spec.ts}`
- Modify: `frontend/src/app/shared/components/footer.component.{ts,html,scss,spec.ts}`
- Modify: `frontend/src/app/shared/components/button.component.{ts,scss,spec.ts}`
- Modify: `frontend/src/app/features/landing/landing.component.{ts,html,scss,spec.ts}`
- Create (via `ng generate`): `features/landing/sections/` — hero, logo-bar, features-grid, workflow-steps, before-after, testimonials, cta-band, pricing-inline

- [ ] **Step 1: Sync design tokens in styles.css**

Verify `:root` in `frontend/src/styles.css` has all tokens from the spec. Missing ones to add:
```css
--surface:    oklch(99.6% 0.003 80);
--surface-2:  oklch(96.5% 0.005 80);
--line:       oklch(90%  0.005 270);
--line-2:     oklch(94%  0.004 270);
--accent-ink: oklch(98%  0.01  255);
--good:       oklch(64%  0.14  155);
--warn:       oklch(72%  0.16   60);
--bad:        oklch(60%  0.18   25);
--grain: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
--shadow-glow: 0 0 0 1px color-mix(in oklch, var(--accent) 30%, transparent),
               0 30px 80px -30px color-mix(in oklch, var(--accent) 60%, transparent);
--focus-ring: 0 0 0 3px var(--accent);
```

Add scroll-reveal CSS:
```css
.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
.reveal--visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; transition: none; } }
```

Ensure Geist imports at top: `@import 'geist/dist/geist.css'; @import 'geist/dist/geist-mono.css';`
If `geist` not installed: `cd frontend && npm install geist`

- [ ] **Step 2: Write failing test for RevealDirective**

```typescript
// frontend/src/app/shared/directives/reveal.directive.spec.ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RevealDirective } from './reveal.directive';

@Component({ standalone: true, imports: [RevealDirective], template: `<div lbaReveal [revealDelay]="0">x</div>` })
class TestHost {}

describe('RevealDirective', () => {
  it('adds .reveal class to host element', () => {
    const fixture = TestBed.configureTestingModule({ imports: [TestHost] }).createComponent(TestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[lbaReveal]').classList.contains('reveal')).toBe(true);
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=reveal.directive --watchAll=false
```

- [ ] **Step 4: Implement RevealDirective**

```typescript
// frontend/src/app/shared/directives/reveal.directive.ts
import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({ selector: '[lbaReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  private el = inject(ElementRef<HTMLElement>);
  private observer!: IntersectionObserver;

  ngOnInit(): void {
    const native = this.el.nativeElement;
    native.classList.add('reveal');
    if (this.revealDelay) native.style.transitionDelay = `${this.revealDelay}ms`;
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { native.classList.add('reveal--visible'); this.observer.disconnect(); }
    }, { threshold: 0.1 });
    this.observer.observe(native);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=reveal.directive --watchAll=false
```

- [ ] **Step 6: Write failing tests for lba-navbar**

```typescript
// frontend/src/app/shared/components/navbar.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [NavbarComponent, RouterTestingModule] }).compileComponents());

  it('renders logo link with correct aria-label', () => {
    const f = TestBed.createComponent(NavbarComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('a[aria-label*="Startseite"]')).toBeTruthy();
  });

  it('renders exactly 4 nav links', () => {
    const f = TestBed.createComponent(NavbarComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.nav__links a').length).toBe(4);
  });

  it('renders Anmelden and Kostenlos starten', () => {
    const f = TestBed.createComponent(NavbarComponent);
    f.detectChanges();
    const html = f.nativeElement.innerHTML;
    expect(html).toContain('Anmelden');
    expect(html).toContain('Kostenlos starten');
  });
});
```

- [ ] **Step 7: Run navbar test — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=navbar.component --watchAll=false
```

- [ ] **Step 8: Implement navbar (TypeScript + template + SCSS)**

TypeScript:
```typescript
// frontend/src/app/shared/components/navbar.component.ts
import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lba-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  protected readonly scrolled = signal(false);
  private readonly listener = () => this.scrolled.set(window.scrollY > 10);
  ngOnInit(): void { window.addEventListener('scroll', this.listener, { passive: true }); }
  ngOnDestroy(): void { window.removeEventListener('scroll', this.listener); }
}
```

Template (full content from spec):
```html
<nav class="nav" [class.scrolled]="scrolled()" aria-label="Hauptnavigation">
  <div class="nav__inner">
    <a routerLink="/" class="nav__logo" aria-label="Lebenslauf-Agent Startseite">
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="oklch(58% 0.20 255)"/>
        <rect x="7" y="7" width="9" height="2" rx="1" fill="white"/>
        <rect x="7" y="11" width="14" height="2" rx="1" fill="white" opacity=".7"/>
        <rect x="7" y="15" width="11" height="2" rx="1" fill="white" opacity=".5"/>
        <rect x="7" y="19" width="8" height="2" rx="1" fill="white" opacity=".3"/>
      </svg>
      Lebenslauf-Agent
    </a>
    <nav class="nav__links" aria-label="Seitennavigation">
      <a routerLink="/" fragment="features">Features</a>
      <a routerLink="/" fragment="workflow">So funktioniert's</a>
      <a routerLink="/" fragment="beispiel">Beispiel</a>
      <a routerLink="/preise">Preise</a>
    </nav>
    <div class="nav__actions">
      <a routerLink="/login" class="btn btn--ghost btn--md">Anmelden</a>
      <a routerLink="/register" class="btn btn--primary btn--md">Kostenlos starten →</a>
    </div>
  </div>
</nav>
```

SCSS: copy from spec (`docs/superpowers/specs/2026-05-09-landing-page-design.md` → navbar section).

- [ ] **Step 9: Run navbar test — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=navbar.component --watchAll=false
```

- [ ] **Step 10: Write failing tests for lba-footer**

```typescript
// frontend/src/app/shared/components/footer.component.spec.ts
describe('FooterComponent', () => {
  it('renders 3 column headings', () => {
    const f = TestBed.createComponent(FooterComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.footer__col-heading').length).toBe(3);
  });

  it('renders copyright text', () => {
    const f = TestBed.createComponent(FooterComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('2026 Lebenslauf-Agent');
  });

  it('Datenschutz link has routerLink=/datenschutz', () => {
    const f = TestBed.createComponent(FooterComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('a[routerLink="/datenschutz"]')).toBeTruthy();
  });
});
```

- [ ] **Step 11: Implement footer then run tests — expect PASS**

Template structure (from spec): brand left (logo + tagline), 3 nav columns (PRODUKT, RESSOURCEN, RECHTLICHES), copyright bar.

```bash
cd frontend && npm test -- --testPathPattern=footer.component --watchAll=false
```

- [ ] **Step 12: Generate all 8 section components via CLI**

```bash
cd frontend
ng generate component features/landing/sections/hero --standalone
ng generate component features/landing/sections/logo-bar --standalone
ng generate component features/landing/sections/features-grid --standalone
ng generate component features/landing/sections/workflow-steps --standalone
ng generate component features/landing/sections/before-after --standalone
ng generate component features/landing/sections/testimonials --standalone
ng generate component features/landing/sections/cta-band --standalone
ng generate component features/landing/sections/pricing-inline --standalone
```

- [ ] **Step 13: For each section — write test, run FAIL, implement, run PASS**

Follow spec exactly for each. Tests listed in spec "Testing Scope" section:

**hero:** h1 contains "Bewerbungen"; CTA link `routerLink="/try"` present; social proof text "4.900 Bewerbungen" present.

**logo-bar:** label "Erfolgreich beworben bei" rendered; 6 company names rendered.

**features-grid:** 4 card titles rendered; 4 card descriptions rendered; `[lbaReveal]` on each card.

**workflow-steps:** 3 step titles rendered; badges "1", "2", "3" present.

**before-after:** "Vorher" and "Nachher" headings present; "41%" and "92%" ATS scores rendered.

**testimonials:** all 3 quote texts rendered; all 3 author names rendered.

**cta-band:** heading "90 Sekunden" present; trust badge "Keine Kreditkarte" present; `routerLink="/try"`.

**pricing-inline:** "4,90 €" and "14 €" rendered; EMPFOHLEN badge present; `routerLink="/register"`.

Run after all sections:
```bash
cd frontend && npm test -- --testPathPattern=sections --watchAll=false
```

- [ ] **Step 14: Implement landing.component to compose all sections**

```typescript
// frontend/src/app/features/landing/landing.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { FooterComponent } from '../../shared/components/footer.component';
import { HeroComponent } from './sections/hero.component';
import { LogoBarComponent } from './sections/logo-bar.component';
import { FeaturesGridComponent } from './sections/features-grid.component';
import { WorkflowStepsComponent } from './sections/workflow-steps.component';
import { BeforeAfterComponent } from './sections/before-after.component';
import { TestimonialsComponent } from './sections/testimonials.component';
import { PricingInlineComponent } from './sections/pricing-inline.component';
import { CtaBandComponent } from './sections/cta-band.component';

@Component({
  selector: 'lba-landing',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, HeroComponent, LogoBarComponent,
    FeaturesGridComponent, WorkflowStepsComponent, BeforeAfterComponent,
    TestimonialsComponent, PricingInlineComponent, CtaBandComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {}
```

```html
<!-- frontend/src/app/features/landing/landing.component.html -->
<lba-navbar />
<main id="main">
  <lba-hero />
  <lba-logo-bar />
  <section id="features" aria-labelledby="features-heading"><lba-features-grid /></section>
  <section id="workflow" aria-labelledby="workflow-heading"><lba-workflow-steps /></section>
  <section id="beispiel" aria-labelledby="beispiel-heading"><lba-before-after /></section>
  <lba-testimonials />
  <lba-pricing-inline />
  <lba-cta-band />
</main>
<lba-footer />
```

- [ ] **Step 15: Full verification**

```bash
cd backend && npm run lint
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm test -- --watchAll=false
cd frontend && npm run build
```

All must exit 0.

- [ ] **Step 16: Commit**

```bash
git add frontend/src/
git commit -m "feat: implement landing page with all sections and scroll reveal"
```

---

## Task 2 — Register

**Goal:** User can create an account. Backend validates input, hashes password with Argon2id, stores email verification token, sends email. Frontend shows reactive form with inline validation and error display.

**Files:**
- Modify: `backend/src/auth/auth.service.ts` (register method)
- Modify: `backend/src/auth/auth.controller.ts` (POST /register)
- Modify: `backend/src/mail/mail.service.ts` (sendVerificationEmail)
- Modify: `frontend/src/app/features/auth/register.component.{ts,html,scss,spec.ts}`
- Modify: `frontend/src/app/core/auth/auth.service.ts` (add register method)

- [ ] **Step 1: Write failing backend tests**

```typescript
// backend/src/auth/auth.service.spec.ts
const mockPrisma = {
  user: { create: jest.fn(), findUnique: jest.fn() },
  emailVerification: { create: jest.fn() },
  consent: { create: jest.fn() },
  session: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
};
const mockMail = { sendVerificationEmail: jest.fn() };

describe('AuthService', () => {
  describe('register', () => {
    it('hashes password and creates user', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.de', name: 'A', plan: 'FREE' });
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockMail.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register({ email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true, ip: '127.0.0.1' });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'a@b.de' }) })
      );
    });

    it('throws BadRequestException when art9Consent is false', async () => {
      await expect(
        service.register({ email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: false, ip: '127.0.0.1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('creates EmailVerification record with 24h expiry', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.de', name: 'A', plan: 'FREE' });
      mockPrisma.emailVerification.create.mockResolvedValue({});

      await service.register({ email: 'a@b.de', password: 'securepass123', name: 'A', art9Consent: true, ip: '127.0.0.1' });

      expect(mockPrisma.emailVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) })
      );
    });
  });
});
```

- [ ] **Step 2: Run backend tests — expect FAIL**

```bash
cd backend && npm test -- --testPathPattern=auth.service --watch=false
```

- [ ] **Step 3: Implement auth.service.ts register method**

```typescript
async register(input: { email: string; password: string; name: string; art9Consent: boolean; ip: string }): Promise<void> {
  if (!input.art9Consent) throw new BadRequestException('Zustimmung zur Datenverarbeitung erforderlich');

  const passwordHash = await argon2.hash(input.password, { memoryCost: 65536, timeCost: 3, parallelism: 4 });
  const ipHash = createHash('sha256').update(input.ip + process.env.IP_HASH_SALT).digest('hex');

  const user = await this.prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });

  await this.prisma.consent.create({ data: { userId: user.id, type: 'art9', ipHash } });

  const token = randomBytes(32).toString('hex');
  await this.prisma.emailVerification.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await this.mail.sendVerificationEmail(user.email, user.name, token);
}
```

- [ ] **Step 4: Implement mail.service.ts sendVerificationEmail**

```typescript
async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const url = `${process.env.APP_URL}/verify-email?token=${token}`;
  await this.resend.emails.send({
    from: 'Lebenslauf-Agent <noreply@lebenslauf-agent.de>',
    to: email,
    subject: 'E-Mail-Adresse bestätigen',
    html: `<p>Hallo ${name},</p><p>Bitte bestätige deine E-Mail-Adresse: <a href="${url}">E-Mail bestätigen</a></p><p>Dieser Link ist 24 Stunden gültig.</p>`,
  });
}
```

- [ ] **Step 5: Verify POST /register controller wires to auth.service.register**

Controller schema (already in skeleton, verify Zod parse is correct):
```typescript
@Post('register')
@Throttle(5, 15 * 60)
async register(@Body() body: unknown, @Ip() ip: string) {
  const data = z.object({
    email: z.string().email(),
    password: z.string().min(12),
    name: z.string().min(2),
    art9Consent: z.literal(true),
  }).parse(body);
  await this.authService.register({ ...data, ip });
  return { message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.' };
}
```

- [ ] **Step 6: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=auth --watch=false
```

- [ ] **Step 7: Write failing frontend tests**

```typescript
// frontend/src/app/features/auth/register.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/auth/auth.service';

describe('RegisterComponent', () => {
  let authService: jest.Mocked<Pick<AuthService, 'register'>>;

  beforeEach(async () => {
    authService = { register: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule, ReactiveFormsModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  it('renders name, email, password fields and art9Consent checkbox', () => {
    const f = TestBed.createComponent(RegisterComponent);
    f.detectChanges();
    const html = f.nativeElement.innerHTML;
    expect(html).toContain('reg-name');
    expect(html).toContain('reg-email');
    expect(html).toContain('reg-password');
    expect(html).toContain('art9');
  });

  it('loading is true during register call, false after', async () => {
    let resolve!: () => void;
    authService.register.mockReturnValue(new Promise((r) => { resolve = () => r(undefined); }));
    const f = TestBed.createComponent(RegisterComponent);
    f.componentInstance.form.setValue({ name: 'A', email: 'a@b.de', password: 'securepass123', art9Consent: true });
    const p = f.componentInstance.submit();
    expect(f.componentInstance.loading()).toBe(true);
    resolve();
    await p;
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('error signal set when API throws HttpErrorResponse', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    authService.register.mockRejectedValue(new HttpErrorResponse({ error: { message: 'E-Mail bereits vergeben' } }));
    const f = TestBed.createComponent(RegisterComponent);
    f.componentInstance.form.setValue({ name: 'A', email: 'a@b.de', password: 'securepass123', art9Consent: true });
    await f.componentInstance.submit();
    expect(f.componentInstance.error()).toBe('E-Mail bereits vergeben');
  });
});
```

- [ ] **Step 8: Run frontend tests — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=register.component --watchAll=false
```

- [ ] **Step 9: Implement RegisterComponent TypeScript**

```typescript
// frontend/src/app/features/auth/register.component.ts
import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lba-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(12)]),
    art9Consent: new FormControl(false, [Validators.requiredTrue]),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.register(this.form.getRawValue() as { name: string; email: string; password: string; art9Consent: boolean });
      await this.router.navigate(['/login'], { queryParams: { registered: '1' } });
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Registrierung fehlgeschlagen');
    } finally {
      this.loading.set(false);
    }
  }
}
```

- [ ] **Step 10: Implement register.component.html**

```html
<main class="auth-page" [attr.aria-busy]="loading()">
  <div class="auth-card">
    <h1 class="auth-title">Konto erstellen</h1>
    <p class="auth-sub">Kostenlos starten — kein Abo nötig.</p>

    @if (error()) {
      <div class="auth-error" role="alert" aria-live="polite">{{ error() }}</div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label for="reg-name">Name</label>
        <input id="reg-name" type="text" formControlName="name" autocomplete="name"
               [attr.aria-describedby]="form.controls.name.invalid && form.controls.name.touched ? 'reg-name-err' : null" />
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <span id="reg-name-err" class="field-error" role="alert">Mindestens 2 Zeichen</span>
        }
      </div>

      <div class="field">
        <label for="reg-email">E-Mail</label>
        <input id="reg-email" type="email" formControlName="email" autocomplete="email"
               [attr.aria-describedby]="form.controls.email.invalid && form.controls.email.touched ? 'reg-email-err' : null" />
        @if (form.controls.email.invalid && form.controls.email.touched) {
          <span id="reg-email-err" class="field-error" role="alert">Gültige E-Mail-Adresse eingeben</span>
        }
      </div>

      <div class="field">
        <label for="reg-password">Passwort</label>
        <input id="reg-password" type="password" formControlName="password" autocomplete="new-password"
               [attr.aria-describedby]="form.controls.password.invalid && form.controls.password.touched ? 'reg-pw-err' : null" />
        @if (form.controls.password.invalid && form.controls.password.touched) {
          <span id="reg-pw-err" class="field-error" role="alert">Mindestens 12 Zeichen</span>
        }
      </div>

      <div class="field field--checkbox">
        <input id="art9" type="checkbox" formControlName="art9Consent" />
        <label for="art9">
          Ich stimme der Verarbeitung meiner Bewerbungsdaten gemäß
          <a routerLink="/datenschutz">Datenschutzerklärung</a> zu (Art. 9 DSGVO).
        </label>
      </div>

      <button type="submit" class="btn btn--primary btn--lg" [disabled]="loading()">
        @if (loading()) { Wird registriert… } @else { Konto erstellen }
      </button>
    </form>

    <p class="auth-footer">Bereits ein Konto? <a routerLink="/login">Anmelden</a></p>
  </div>
</main>
```

- [ ] **Step 11: Add shared auth SCSS (used by register + login)**

```scss
// frontend/src/app/features/auth/register.component.scss (import from shared or duplicate for login)
:host { display: block; }
.auth-page { min-height: 100dvh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: var(--space-6); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--line-2); border-radius: var(--radius-lg); padding: var(--space-8); box-shadow: var(--shadow-md); }
.auth-title { font-size: 24px; font-weight: 600; margin-bottom: var(--space-2); color: var(--ink); }
.auth-sub { color: var(--ink-2); font-size: 14px; margin-bottom: var(--space-6); }
.auth-error { background: color-mix(in oklch, var(--bad) 10%, transparent); border: 1px solid var(--bad); color: var(--bad); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); font-size: 14px; }
.field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
.field label { font-size: 14px; font-weight: 500; color: var(--ink); }
.field input { padding: 10px 14px; border: 1px solid var(--line); border-radius: var(--radius-sm); font-size: 14px; font-family: var(--font-sans); background: var(--bg); color: var(--ink); width: 100%; box-sizing: border-box; }
.field input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-color: transparent; }
.field-error { font-size: 12px; color: var(--bad); }
.field--checkbox { flex-direction: row; align-items: flex-start; gap: var(--space-2); }
.field--checkbox label { font-size: 13px; }
.btn--lg { width: 100%; justify-content: center; margin-top: var(--space-2); }
.auth-footer { margin-top: var(--space-6); font-size: 14px; color: var(--ink-2); text-align: center; }
.auth-footer a { color: var(--accent); }
```

- [ ] **Step 12: Add register method to frontend AuthService if not present**

```typescript
// In frontend/src/app/core/auth/auth.service.ts — add:
async register(data: { name: string; email: string; password: string; art9Consent: boolean }): Promise<void> {
  await firstValueFrom(this.http.post('/api/auth/register', data));
}
```

- [ ] **Step 13: Run frontend tests — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=register.component --watchAll=false
```

- [ ] **Step 14: Full verification**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
```

- [ ] **Step 15: Commit**

```bash
git add backend/src/auth/ backend/src/mail/ frontend/src/app/features/auth/register.component.* frontend/src/app/core/auth/auth.service.ts
git commit -m "feat: implement register with email verification (backend + frontend)"
```

---

## Task 3 — Login

**Goal:** User can log in with email + password. Backend issues JWT + refresh token cookie. Frontend form navigates to `/app` on success.

**Files:**
- Modify: `backend/src/auth/auth.service.ts` (login, refresh, logout, verifyEmail)
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `frontend/src/app/features/auth/login.component.{ts,html,scss,spec.ts}`
- Modify: `frontend/src/app/core/auth/auth.service.ts` (login, logout, refresh methods)

- [ ] **Step 1: Write failing backend tests**

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@y.de', password: 'pass', ip: '127.0.0.1', ua: 'test' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: await argon2.hash('correct') } as any);
      await expect(service.login({ email: 'x@y.de', password: 'wrong', ip: '127.0.0.1', ua: 'test' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email not verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: await argon2.hash('pass'), emailVerifiedAt: null } as any);
      await expect(service.login({ email: 'x@y.de', password: 'pass', ip: '127.0.0.1', ua: 'test' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken and user on valid credentials', async () => {
      const hash = await argon2.hash('validpass');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.de', passwordHash: hash, emailVerifiedAt: new Date(), plan: 'FREE', twoFactorEnabled: false } as any);
      mockPrisma.session.findMany.mockResolvedValue([]);
      mockPrisma.session.create.mockResolvedValue({});

      const result = await service.login({ email: 'a@b.de', password: 'validpass', ip: '127.0.0.1', ua: 'test' });

      expect(result).toHaveProperty('accessToken');
      expect(result.user).toHaveProperty('id', 'u1');
    });
  });
});
```

- [ ] **Step 2: Run backend tests — expect FAIL**

```bash
cd backend && npm test -- --testPathPattern=auth.service --watch=false
```

- [ ] **Step 3: Implement login in auth.service.ts**

```typescript
async login(input: { email: string; password: string; ip: string; ua: string }) {
  const user = await this.prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedException('Ungültige Zugangsdaten');

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) throw new UnauthorizedException('Ungültige Zugangsdaten');

  if (!user.emailVerifiedAt) throw new UnauthorizedException('Bitte zuerst E-Mail bestätigen');

  return this.issueTokens(user, input.ip, input.ua);
}

private async issueTokens(user: User, ip: string, ua: string) {
  const sessions = await this.prisma.session.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  if (sessions.length >= 5) {
    await this.prisma.session.deleteMany({ where: { id: { in: sessions.slice(0, sessions.length - 4).map((s) => s.id) } } });
  }

  const refreshToken = randomBytes(32).toString('hex');
  const refreshHash = createHash('sha256').update(refreshToken).digest('hex');
  const ipHash = createHash('sha256').update(ip + process.env.IP_HASH_SALT).digest('hex');

  await this.prisma.session.create({
    data: { userId: user.id, refreshHash, ipHash, userAgent: ua, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  const accessToken = this.jwt.sign(
    { sub: user.id, plan: user.plan, ev: !!user.emailVerifiedAt, tfa: user.twoFactorEnabled },
    { expiresIn: '15m' }
  );

  return { accessToken, refreshToken, user: { id: user.id, plan: user.plan } };
}
```

- [ ] **Step 4: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=auth --watch=false
```

- [ ] **Step 5: Write failing frontend tests**

```typescript
// frontend/src/app/features/auth/login.component.spec.ts
describe('LoginComponent', () => {
  it('renders email and password fields', () => {
    const f = TestBed.createComponent(LoginComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('#login-email')).toBeTruthy();
    expect(f.nativeElement.querySelector('#login-password')).toBeTruthy();
  });

  it('loading true during login call, false after', async () => {
    let resolve!: () => void;
    authService.login.mockReturnValue(new Promise((r) => { resolve = () => r(undefined); }));
    const f = TestBed.createComponent(LoginComponent);
    f.componentInstance.form.setValue({ email: 'a@b.de', password: 'validpass' });
    const p = f.componentInstance.submit();
    expect(f.componentInstance.loading()).toBe(true);
    resolve();
    await p;
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('error signal set on login failure', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    authService.login.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Ungültige Zugangsdaten' } }));
    const f = TestBed.createComponent(LoginComponent);
    f.componentInstance.form.setValue({ email: 'a@b.de', password: 'wrong' });
    await f.componentInstance.submit();
    expect(f.componentInstance.error()).toBe('Ungültige Zugangsdaten');
  });
});
```

- [ ] **Step 6: Run frontend tests — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=login.component --watchAll=false
```

- [ ] **Step 7: Implement LoginComponent TypeScript**

```typescript
// frontend/src/app/features/auth/login.component.ts
import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lba-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly justRegistered = this.route.snapshot.queryParams['registered'] === '1';

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      await this.router.navigate(['/app']);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Anmeldung fehlgeschlagen');
    } finally {
      this.loading.set(false);
    }
  }
}
```

- [ ] **Step 8: Implement login.component.html** (same pattern as register, simpler)

- [ ] **Step 9: Run frontend tests — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=login.component --watchAll=false
```

- [ ] **Step 10: Full verification**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
```

- [ ] **Step 11: Commit**

```bash
git add backend/src/auth/ frontend/src/app/features/auth/login.component.* frontend/src/app/core/auth/
git commit -m "feat: implement login with JWT session (backend + frontend)"
```

---

## Task 4 — Dashboard

**Goal:** Authenticated users land at `/app` and see their CV count, application count, and last 5 applications.

**Files:**
- Modify: `backend/src/users/users.service.ts` (getDashboard)
- Modify: `backend/src/users/users.controller.ts` (GET /users/me/dashboard)
- Modify: `frontend/src/app/features/dashboard/dashboard.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Write failing backend test**

```typescript
describe('UsersService', () => {
  describe('getDashboard', () => {
    it('returns cvCount, applicationCount, recentApplications', async () => {
      mockPrisma.masterCv.count.mockResolvedValue(2);
      mockPrisma.application.count.mockResolvedValue(5);
      mockPrisma.application.findMany.mockResolvedValue([
        { id: 'a1', jobTitle: 'FE Dev', companyName: 'Stripe', atsScore: 88, status: 'draft', createdAt: new Date() },
      ]);

      const result = await service.getDashboard('u1');

      expect(result.cvCount).toBe(2);
      expect(result.applicationCount).toBe(5);
      expect(result.recentApplications).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run backend test — expect FAIL**

```bash
cd backend && npm test -- --testPathPattern=users.service --watch=false
```

- [ ] **Step 3: Implement getDashboard**

```typescript
async getDashboard(userId: string) {
  const [cvCount, applicationCount, recentApplications] = await Promise.all([
    this.prisma.masterCv.count({ where: { userId } }),
    this.prisma.application.count({ where: { userId } }),
    this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, jobTitle: true, companyName: true, atsScore: true, status: true, createdAt: true },
    }),
  ]);
  return { cvCount, applicationCount, recentApplications };
}
```

- [ ] **Step 4: Add GET /api/users/me/dashboard controller route**

```typescript
@Get('me/dashboard')
@UseGuards(JwtAuthGuard)
async dashboard(@Request() req: any) {
  return this.usersService.getDashboard(req.user.sub);
}
```

- [ ] **Step 5: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=users --watch=false
```

- [ ] **Step 6: Write failing frontend test**

```typescript
describe('DashboardComponent', () => {
  it('loading true on init, false after data loads', async () => {
    let resolve!: (v: any) => void;
    api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const f = TestBed.createComponent(DashboardComponent);
    f.detectChanges();
    expect(f.componentInstance.loading()).toBe(true);
    resolve({ cvCount: 2, applicationCount: 5, recentApplications: [] });
    await f.whenStable();
    expect(f.componentInstance.loading()).toBe(false);
    expect(f.componentInstance.data()?.cvCount).toBe(2);
  });

  it('error signal set when API throws', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Server error' } }));
    const f = TestBed.createComponent(DashboardComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.error()).toBe('Server error');
  });
});
```

- [ ] **Step 7: Run frontend test — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=dashboard.component --watchAll=false
```

- [ ] **Step 8: Implement DashboardComponent TypeScript**

```typescript
// frontend/src/app/features/dashboard/dashboard.component.ts
import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';

interface DashboardData {
  cvCount: number;
  applicationCount: number;
  recentApplications: { id: string; jobTitle: string; companyName: string; atsScore: number; status: string; createdAt: string }[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.get<DashboardData>('/api/users/me/dashboard'));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Daten konnten nicht geladen werden');
    } finally {
      this.loading.set(false);
    }
  }
}
```

- [ ] **Step 9: Implement dashboard template**

Show stat cards (CV count, application count). Skeleton loaders when `loading()` with `aria-busy="true"`. Recent applications table with job title, company, ATS score badge, status. CTA button `routerLink="/app/wizard"`.

Error: `<div role="alert" aria-live="polite">{{ error() }}</div>` when `error()` is set.

- [ ] **Step 10: Run frontend tests — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=dashboard --watchAll=false
```

- [ ] **Step 11: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/users/ frontend/src/app/features/dashboard/
git commit -m "feat: implement dashboard with stats (backend + frontend)"
```

---

## Task 5 — Master CV Upload

**Goal:** User can upload a PDF/DOCX, it gets parsed by AI, stored as a `MasterCv` record, and listed on the page.

**Files:**
- Modify: `backend/src/cvs/cvs.service.ts`
- Modify: `backend/src/cvs/cvs.controller.ts`
- Modify: `backend/src/ai/ai.service.ts` (parseCv method)
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Write failing backend tests**

```typescript
describe('CvsService', () => {
  describe('create', () => {
    it('throws BadRequestException for non-PDF/DOCX magic bytes', async () => {
      await expect(service.create('u1', Buffer.from('not a pdf'), 'test.txt'))
        .rejects.toThrow(BadRequestException);
    });

    it('calls AiService.parseCv with extracted text', async () => {
      const pdfBuf = Buffer.from('%PDF-test content');
      mockAi.parseCv.mockResolvedValue({ name: 'Lina', skills: ['React'] });
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv1' } as any);

      await service.create('u1', pdfBuf, 'cv.pdf');

      expect(mockAi.parseCv).toHaveBeenCalled();
    });

    it('returns created MasterCv', async () => {
      const pdfBuf = Buffer.from('%PDF-test');
      mockAi.parseCv.mockResolvedValue({});
      mockPrisma.masterCv.create.mockResolvedValue({ id: 'cv1', name: 'cv' } as any);

      const result = await service.create('u1', pdfBuf, 'cv.pdf');

      expect(result).toHaveProperty('id', 'cv1');
    });
  });

  describe('findAll', () => {
    it('returns only CVs belonging to userId', async () => {
      mockPrisma.masterCv.findMany.mockResolvedValue([{ id: 'cv1', userId: 'u1' }] as any);
      const result = await service.findAll('u1');
      expect(mockPrisma.masterCv.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
    });
  });
});
```

- [ ] **Step 2: Run backend tests — expect FAIL**

```bash
cd backend && npm test -- --testPathPattern=cvs.service --watch=false
```

- [ ] **Step 3: Implement CvsService**

```typescript
async create(userId: string, buffer: Buffer, filename: string) {
  const isPdf = buffer.slice(0, 5).toString('ascii') === '%PDF-';
  const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4B;
  if (!isPdf && !isDocx) throw new BadRequestException('Nur PDF oder DOCX erlaubt');

  const rawText = isPdf ? await this.extractPdfText(buffer) : await this.extractDocxText(buffer);
  const parsed = await this.ai.parseCv(rawText);

  return this.prisma.masterCv.create({
    data: { userId, name: filename.replace(/\.[^.]+$/, ''), rawText, parsed },
  });
}

async findAll(userId: string) {
  return this.prisma.masterCv.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

async remove(id: string, userId: string) {
  const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
  if (!cv) throw new NotFoundException('CV nicht gefunden');
  await this.prisma.masterCv.delete({ where: { id } });
}
```

Text extraction: use `pdf-parse` for PDFs (`npm install pdf-parse`) and `mammoth` for DOCX (`npm install mammoth`).

- [ ] **Step 4: Wire controller routes**

```typescript
// backend/src/cvs/cvs.controller.ts
@Post()
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
async upload(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
  return this.cvsService.create(req.user.sub, file.buffer, file.originalname);
}

@Get()
@UseGuards(JwtAuthGuard)
async findAll(@Request() req: any) {
  return this.cvsService.findAll(req.user.sub);
}

@Delete(':id')
@UseGuards(JwtAuthGuard)
async remove(@Param('id') id: string, @Request() req: any) {
  await this.cvsService.remove(id, req.user.sub);
}
```

- [ ] **Step 5: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=cvs --watch=false
```

- [ ] **Step 6: Write failing frontend tests**

```typescript
describe('MasterCvsComponent', () => {
  it('loading true on init, false after CVs load', async () => {
    let resolve!: (v: any) => void;
    api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const f = TestBed.createComponent(MasterCvsComponent);
    f.detectChanges();
    expect(f.componentInstance.loading()).toBe(true);
    resolve([]);
    await f.whenStable();
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('upload input accepts .pdf and .docx', () => {
    api.get.mockResolvedValue([]);
    const f = TestBed.createComponent(MasterCvsComponent);
    f.detectChanges();
    const input = f.nativeElement.querySelector('input[type=file]');
    expect(input?.getAttribute('accept')).toContain('.pdf');
    expect(input?.getAttribute('accept')).toContain('.docx');
  });

  it('error signal set when list API throws', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' } }));
    const f = TestBed.createComponent(MasterCvsComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.error()).toBeTruthy();
  });
});
```

- [ ] **Step 7: Run frontend tests — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=master-cvs --watchAll=false
```

- [ ] **Step 8: Implement MasterCvsComponent**

Upload zone with drag+drop (dashed border, upload icon, filename display). File input `accept=".pdf,.docx"`. On file select: POST to `/api/cvs` with `FormData`. Show uploaded CV list. Delete button per row.

Use loading/error signals. `aria-busy="true"` on container during upload. Error in `aria-live="polite"` region.

- [ ] **Step 9: Run frontend tests — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=master-cvs --watchAll=false
```

- [ ] **Step 10: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/cvs/ frontend/src/app/features/master-cvs/
git commit -m "feat: implement master CV upload with AI parsing (backend + frontend)"
```

---

## Task 6 — Wizard (Job Posting + AI Optimization)

**Goal:** 3-step wizard: select master CV → paste job posting → generate optimized application → navigate to editor.

**Files:**
- Modify: `backend/src/jobs/jobs.service.ts` (parseJob)
- Modify: `backend/src/jobs/jobs.controller.ts`
- Modify: `backend/src/applications/applications.service.ts` (create)
- Modify: `backend/src/applications/applications.controller.ts`
- Modify: `backend/src/ai/ai.service.ts` (parseJob, optimize methods)
- Modify: `frontend/src/app/features/wizard/wizard.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Write failing backend tests**

```typescript
describe('ApplicationsService', () => {
  describe('create', () => {
    it('throws NotFoundException when masterCv not found or not owned', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      await expect(service.create('u1', 'cv-bad', 'job text')).rejects.toThrow(NotFoundException);
    });

    it('calls ai.optimize with parsed cv and job', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv1', parsed: {} } as any);
      mockAi.parseJob.mockResolvedValue({ title: 'FE Dev', company: 'Stripe', keywords: [] });
      mockAi.optimize.mockResolvedValue({ optimizedCv: {}, coverLetter: {}, matchReport: {}, atsScore: 88 });
      mockPrisma.application.create.mockResolvedValue({ id: 'app1' } as any);

      const result = await service.create('u1', 'cv1', 'Frontend Developer at Stripe...');

      expect(mockAi.optimize).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'app1');
    });
  });
});
```

- [ ] **Step 2: Run backend tests — expect FAIL**

```bash
cd backend && npm test -- --testPathPattern=applications.service --watch=false
```

- [ ] **Step 3: Implement ApplicationsService.create**

```typescript
async create(userId: string, masterCvId: string, jobRaw: string) {
  const cv = await this.prisma.masterCv.findFirst({ where: { id: masterCvId, userId } });
  if (!cv) throw new NotFoundException('Master-CV nicht gefunden');

  const job = await this.ai.parseJob(jobRaw);
  const { optimizedCv, coverLetter, matchReport, atsScore } = await this.ai.optimize(cv.parsed, job);

  return this.prisma.application.create({
    data: { userId, masterCvId, jobTitle: job.title, companyName: job.company, jobRaw, optimizedCv, coverLetter, matchReport, atsScore },
  });
}
```

- [ ] **Step 4: Add POST /api/applications route**

```typescript
@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() body: unknown, @Request() req: any) {
  const { masterCvId, jobRaw } = z.object({ masterCvId: z.string(), jobRaw: z.string().min(50) }).parse(body);
  return this.applicationsService.create(req.user.sub, masterCvId, jobRaw);
}
```

- [ ] **Step 5: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=applications --watch=false
```

- [ ] **Step 6: Write failing frontend tests**

```typescript
describe('WizardComponent', () => {
  it('starts on step 1 (CV selection)', () => {
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    expect(f.componentInstance.step()).toBe(1);
  });

  it('advances to step 2 when CV is selected', () => {
    const f = TestBed.createComponent(WizardComponent);
    f.detectChanges();
    f.componentInstance.selectCv('cv1');
    expect(f.componentInstance.step()).toBe(2);
  });

  it('error signal set when create API throws', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' } }));
    const f = TestBed.createComponent(WizardComponent);
    f.componentInstance.selectedCvId.set('cv1');
    f.componentInstance.jobForm.setValue({ jobRaw: 'Frontend Developer at Stripe with React skills...' });
    await f.componentInstance.generate();
    expect(f.componentInstance.error()).toBeTruthy();
  });
});
```

- [ ] **Step 7: Run frontend tests — expect FAIL**

```bash
cd frontend && npm test -- --testPathPattern=wizard --watchAll=false
```

- [ ] **Step 8: Implement WizardComponent**

3 steps managed by `readonly step = signal(1)`:
- Step 1: List master CVs, click to select → `step.set(2)`
- Step 2: Textarea for job posting (ReactiveForm, `jobRaw` control, min 50 chars) + "Weiter" button → `step.set(3)` on valid
- Step 3: "Bewerbung generieren" button → POST `/api/applications` → navigate to `/app/applications/:id`

Loading state on step 3 button. Error in `aria-live="polite"`.

- [ ] **Step 9: Run frontend tests — expect PASS**

```bash
cd frontend && npm test -- --testPathPattern=wizard --watchAll=false
```

- [ ] **Step 10: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/applications/ backend/src/jobs/ frontend/src/app/features/wizard/
git commit -m "feat: implement wizard with job parsing and AI optimization (backend + frontend)"
```

---

## Task 7 — Application Editor

**Goal:** 3-panel editor at `/app/applications/:id` — match report (left), CV editor (centre), cover letter tabs (right).

**Files:**
- Modify: `backend/src/applications/applications.service.ts` (findOne, update, remove)
- Modify: `backend/src/applications/applications.controller.ts`
- Modify: `frontend/src/app/features/application-editor/editor.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Write failing backend tests**

```typescript
describe('findOne', () => {
  it('throws ForbiddenException when application belongs to another user', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'other' } as any);
    await expect(service.findOne('a1', 'u1')).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when not found', async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    await expect(service.findOne('a1', 'u1')).rejects.toThrow(NotFoundException);
  });
});

describe('update', () => {
  it('calls prisma.application.update with merged data', async () => {
    mockPrisma.application.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' } as any);
    mockPrisma.application.update.mockResolvedValue({ id: 'a1' } as any);
    await service.update('a1', 'u1', { status: 'sent' });
    expect(mockPrisma.application.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { status: 'sent' } });
  });
});
```

- [ ] **Step 2: Run backend tests — expect FAIL then implement findOne / update / remove, run PASS**

```bash
cd backend && npm test -- --testPathPattern=applications.service --watch=false
```

- [ ] **Step 3: Add GET/:id, PATCH/:id, DELETE/:id routes**

All require `JwtAuthGuard`. PATCH uses Zod to parse optional `optimizedCv`, `coverLetter`, `status`.

- [ ] **Step 4: Write failing frontend tests**

```typescript
describe('EditorComponent', () => {
  it('loads application by route param id on init', async () => {
    api.get.mockResolvedValue({ id: 'a1', atsScore: 88, optimizedCv: {}, coverLetter: { formal: 'x', casual: 'y', brief: 'z' }, matchReport: {} });
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    expect(api.get).toHaveBeenCalledWith('/api/applications/a1');
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('error signal set when load fails', async () => {
    const { HttpErrorResponse } = await import('@angular/common/http');
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Not found' } }));
    const f = TestBed.createComponent(EditorComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.error()).toBe('Not found');
  });
});
```

- [ ] **Step 5: Implement EditorComponent**

3-panel layout:
- **Left:** ATS score (large number), keyword match list, match report summary
- **Centre:** Editable CV sections with `FormGroup` — auto-saves on blur via PATCH `/api/applications/:id`
- **Right:** 3 tab buttons (Formal / Herzlich / Kurz), editable textarea per tab

Loading state: skeleton loaders with `aria-busy="true"`.

- [ ] **Step 6: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/applications/ frontend/src/app/features/application-editor/
git commit -m "feat: implement application editor (backend + frontend)"
```

---

## Task 8 — PDF Export

**Goal:** Download button in the editor generates a print-ready PDF of the optimized CV.

**Files:**
- Modify: `backend/src/pdf/pdf.service.ts`
- Modify: `backend/src/applications/applications.controller.ts` (GET /:id/pdf)
- Modify: `frontend/src/app/features/application-editor/editor.component.ts` (add download method)

- [ ] **Step 1: Install pdf-lib**

```bash
cd backend && npm install pdf-lib
```

- [ ] **Step 2: Write failing backend test**

```typescript
it('generateCvPdf returns Buffer starting with %PDF-', async () => {
  const buf = await service.generateCvPdf({ name: 'Lina Hartmann', sections: [{ heading: 'Erfahrung', lines: ['Stripe — 2 Jahre'] }] });
  expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-');
});
```

- [ ] **Step 3: Implement PdfService.generateCvPdf using pdf-lib**

```typescript
async generateCvPdf(data: { name: string; sections: { heading: string; lines: string[] }[] }): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  page.drawText(data.name, { x: 50, y, font: boldFont, size: 20, color: rgb(0.08, 0.07, 0.16) });
  y -= 30;

  for (const section of data.sections) {
    page.drawText(section.heading, { x: 50, y, font: boldFont, size: 11, color: rgb(0.08, 0.07, 0.16) });
    y -= 18;
    for (const line of section.lines) {
      page.drawText(line, { x: 50, y, font, size: 10, color: rgb(0.22, 0.2, 0.32) });
      y -= 14;
    }
    y -= 8;
  }

  return Buffer.from(await pdfDoc.save());
}
```

- [ ] **Step 4: Add GET /api/applications/:id/pdf route**

```typescript
@Get(':id/pdf')
@UseGuards(JwtAuthGuard)
async downloadPdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
  const app = await this.applicationsService.findOne(id, req.user.sub);
  const buffer = await this.pdfService.generateCvPdf(app.optimizedCv as any);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Lebenslauf_${app.companyName}.pdf"`,
  });
  res.send(buffer);
}
```

- [ ] **Step 5: Add download button to editor component**

```typescript
async downloadPdf(): Promise<void> {
  const blob = await this.api.getBlob(`/api/applications/${this.id}/pdf`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lebenslauf.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/pdf/ backend/src/applications/ frontend/src/app/features/application-editor/
git commit -m "feat: add PDF export for optimized CV"
```

---

## Task 9 — Pricing Page + Billing

**Goal:** `/preise` shows 2-card pricing. PRO card opens Paddle checkout. Paddle webhook upgrades/downgrades user plan.

**Files:**
- Modify: `backend/src/payments/payments.service.ts`
- Modify: `backend/src/payments/payments.controller.ts`
- Modify: `frontend/src/app/features/pricing/pricing.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Install @paddle/paddle-node-sdk**

```bash
cd backend && npm install @paddle/paddle-node-sdk
```

- [ ] **Step 2: Write failing backend test**

```typescript
describe('PaymentsService', () => {
  it('throws UnauthorizedException on invalid webhook signature', async () => {
    jest.spyOn(service as any, 'isValidSignature').mockReturnValue(false);
    await expect(service.handleWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toThrow(UnauthorizedException);
  });

  it('upgrades user to PRO on subscription.activated', async () => {
    jest.spyOn(service as any, 'isValidSignature').mockReturnValue(true);
    mockPrisma.user.update.mockResolvedValue({} as any);
    const event = JSON.stringify({ event_type: 'subscription.activated', data: { custom_data: { userId: 'u1' } } });

    await service.handleWebhook(Buffer.from(event), 'valid');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { plan: 'PRO' } });
  });
});
```

- [ ] **Step 3: Implement PaymentsService**

```typescript
async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  if (!this.isValidSignature(rawBody, signature)) throw new UnauthorizedException('Ungültige Webhook-Signatur');

  const event = JSON.parse(rawBody.toString());
  const userId = event.data?.custom_data?.userId;
  if (!userId) return;

  if (event.event_type === 'subscription.activated') {
    await this.prisma.user.update({ where: { id: userId }, data: { plan: 'PRO' } });
  }
  if (event.event_type === 'subscription.cancelled') {
    await this.prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
  }
}

private isValidSignature(rawBody: Buffer, signature: string): boolean {
  const expected = createHmac('sha256', process.env.PADDLE_WEBHOOK_SECRET!).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

- [ ] **Step 4: Add POST /api/payments/webhook (no JwtAuthGuard — verified by HMAC)**

- [ ] **Step 5: Run backend tests — expect PASS**

```bash
cd backend && npm test -- --testPathPattern=payments --watch=false
```

- [ ] **Step 6: Implement pricing.component**

Static 2-card layout (same content as `lba-pricing-inline`). PRO card CTA button calls `Paddle.Checkout.open({ items: [{ priceId: environment.paddlePriceIdPro, quantity: 1 }], customData: { userId: authService.user()?.id } })`.

- [ ] **Step 7: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/payments/ frontend/src/app/features/pricing/
git commit -m "feat: implement pricing page and Paddle billing webhook"
```

---

## Task 10 — Try / Demo Page

**Goal:** `/try` works without auth. User pastes CV text + job posting → gets a truncated demo result + CTA to register.

**Files:**
- Modify: `backend/src/trial/trial.service.ts`
- Modify: `backend/src/trial/trial.controller.ts`
- Modify: `frontend/src/app/features/try/try.component.{ts,html,scss,spec.ts}`

- [ ] **Step 1: Write failing backend test**

```typescript
it('POST /trial returns atsScore and preview text', async () => {
  mockAi.parseCv.mockResolvedValue({});
  mockAi.parseJob.mockResolvedValue({ title: 'Dev', company: 'X', keywords: ['React'] });
  mockAi.optimize.mockResolvedValue({ optimizedCv: {}, coverLetter: { formal: 'Dear hiring...' }, matchReport: {}, atsScore: 82 });

  const result = await service.run('CV text here...', 'Job posting text here...');

  expect(result.atsScore).toBe(82);
  expect(result.coverLetterPreview).toBeTruthy();
});
```

- [ ] **Step 2: Implement TrialService.run**

Calls `ai.parseCv`, `ai.parseJob`, `ai.optimize`. Returns: `{ atsScore, keywords, coverLetterPreview: coverLetter.formal.slice(0, 200) + '…' }`.

- [ ] **Step 3: Add POST /api/trial (throttle: 3/hour per IP, no auth)**

- [ ] **Step 4: Implement TryComponent** — two large textareas (CV text, job text), submit → show result card with ATS score + preview + "Vollständiges Ergebnis — jetzt registrieren" CTA.

- [ ] **Step 5: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/trial/ frontend/src/app/features/try/
git commit -m "feat: implement try/demo page without auth"
```

---

## Task 11 — Legal Pages

**Goal:** Static content pages for Datenschutz (`/datenschutz`), AGB (`/agb`), Impressum (`/impressum`).

**Files:**
- Modify: `frontend/src/app/features/legal/privacy.component.{ts,html,spec.ts}`
- Modify: `frontend/src/app/features/legal/terms.component.{ts,html,spec.ts}`
- Modify: `frontend/src/app/features/legal/imprint.component.{ts,html,spec.ts}`

- [ ] **Step 1: Implement all three components**

Each follows the same pattern:
```typescript
@Component({
  selector: 'lba-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {}
```

Content: pull from `docs/` DSGVO templates (DSFA, VVT, TOM).

- [ ] **Step 2: Write tests for each** (renders `<h1>`, renders navbar, renders footer)

- [ ] **Step 3: Full verification + commit**

```bash
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add frontend/src/app/features/legal/
git commit -m "feat: add legal pages (Datenschutz, AGB, Impressum)"
```

---

## Task 12 — GDPR

**Goal:** Users can download all their data as JSON or permanently delete their account.

**Files:**
- Modify: `backend/src/gdpr/gdpr.service.ts`
- Modify: `backend/src/gdpr/gdpr.controller.ts`
- Create: `frontend/src/app/features/billing/billing.component.{ts,html,scss,spec.ts}` (account settings + GDPR actions)

- [ ] **Step 1: Write failing backend tests**

```typescript
describe('GdprService', () => {
  it('exportData returns user, masterCvs, applications', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.de' } as any);
    mockPrisma.masterCv.findMany.mockResolvedValue([]);
    mockPrisma.application.findMany.mockResolvedValue([]);

    const result = await service.exportData('u1');

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('masterCvs');
    expect(result).toHaveProperty('applications');
  });

  it('deleteAccount calls prisma.user.delete', async () => {
    mockPrisma.user.delete.mockResolvedValue({} as any);
    await service.deleteAccount('u1');
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
```

- [ ] **Step 2: Implement GdprService**

```typescript
async exportData(userId: string) {
  const [user, masterCvs, applications] = await Promise.all([
    this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, plan: true, createdAt: true } }),
    this.prisma.masterCv.findMany({ where: { userId } }),
    this.prisma.application.findMany({ where: { userId } }),
  ]);
  return { user, masterCvs, applications, exportedAt: new Date().toISOString() };
}

async deleteAccount(userId: string): Promise<void> {
  await this.prisma.user.delete({ where: { id: userId } });
}
```

- [ ] **Step 3: Add routes**

```typescript
@Get('export')
@UseGuards(JwtAuthGuard)
async export(@Request() req: any, @Res() res: Response) {
  const data = await this.gdprService.exportData(req.user.sub);
  res.set({ 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="meine-daten.json"' });
  res.json(data);
}

@Delete('account')
@UseGuards(JwtAuthGuard)
async deleteAccount(@Request() req: any) {
  await this.gdprService.deleteAccount(req.user.sub);
  return { message: 'Konto und alle Daten gelöscht' };
}
```

- [ ] **Step 4: Implement BillingComponent** — plan info, "Daten exportieren" button, "Konto löschen" button with confirmation dialog.

- [ ] **Step 5: Full verification + commit**

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test -- --watchAll=false && npm run build
git add backend/src/gdpr/ frontend/src/app/features/billing/
git commit -m "feat: implement GDPR data export and account deletion"
```

---

## Task 13 — Not Found Page

**Goal:** Unknown routes show a friendly 404 page.

**Files:**
- Modify: `frontend/src/app/features/not-found/not-found.component.{ts,html,spec.ts}`

- [ ] **Step 1: Implement NotFoundComponent**

```typescript
@Component({
  selector: 'lba-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="not-found" aria-label="Seite nicht gefunden">
      <h1 class="not-found__code">404</h1>
      <p class="not-found__msg">Diese Seite existiert nicht.</p>
      <a routerLink="/" class="btn btn--primary btn--md">Zur Startseite</a>
    </main>
  `,
  styles: [`:host{display:flex;align-items:center;justify-content:center;min-height:100dvh;flex-direction:column;gap:var(--space-4);text-align:center;background:var(--bg)}.not-found__code{font-size:80px;font-weight:700;color:var(--ink-3);margin:0}.not-found__msg{color:var(--ink-2);font-size:18px;margin:0}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
```

- [ ] **Step 2: Write test** (renders "404" text, renders link to `/`)

- [ ] **Step 3: Full final verification**

```bash
cd backend && npm run lint
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm test -- --watchAll=false
cd frontend && npm run build
```

All must exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/features/not-found/
git commit -m "feat: add 404 not-found page"
```

---

## Appendix A — AiService interface

```typescript
// backend/src/ai/ai.service.ts — must expose:
interface AiService {
  parseCv(rawText: string): Promise<ParsedCV>
  parseJob(rawText: string): Promise<{ title: string; company: string; keywords: string[]; tone: string }>
  optimize(cv: ParsedCV, job: ParsedJob): Promise<{
    optimizedCv: OptimizedCV
    coverLetter: { formal: string; casual: string; brief: string }
    matchReport: MatchReport
    atsScore: number
  }>
}
```

All outputs validated with Zod. 3 retries with stricter prompt on schema failure. User input wrapped in `<<<DELIMITER>>>...<<<END>>>`.

---

## Appendix B — Environment variables

```env
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/lba
REDIS_URL=redis://localhost:6379
JWT_SECRET=<EdDSA private key PEM>
IP_HASH_SALT=<random 32-byte hex>
RESEND_API_KEY=re_...
APP_URL=http://localhost:4200
PADDLE_WEBHOOK_SECRET=<webhook secret from Paddle dashboard>
PADDLE_PRICE_ID_PRO=pri_...
MISTRAL_API_KEY=...

# frontend/src/environments/environment.ts
export const environment = { apiUrl: '/api', paddlePriceIdPro: 'pri_...' };
```
