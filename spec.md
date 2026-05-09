# Lebenslauf-Agent — Finale Spezifikation V1.0

> Konsolidiert aus Architektur-Interview · Solo-Dev · 3–4 Monate · Strict EU · WCAG 2.2 AAA

---

## 0. Eckdaten

| | |
|---|---|
| **Team** | 1 Person (Solo) |
| **Timeline** | 3–4 Monate bis erstem zahlenden User |
| **Hosting** | **IONOS Cloud (Berlin/Karlsruhe, BSI C5 Typ 2)** — Strict EU |
| **Frontend** | **Angular 21** Standalone, **Zoneless**, **Signal-based Forms** — klassisches Repo |
| **Backend** | NestJS (Node 20, TypeScript) |
| **DB** | PostgreSQL 16 self-hosted (IONOS VPS XL 8) |
| **Cache/Queue** | Redis 7 (BullMQ) |
| **Auth** | Self-hosted JWT (Ed25519) + Argon2id, optionales TOTP-2FA |
| **AI Pilot** | **Mistral Free Tier (FR, EU, gratis bis ~1 Mio Tokens/mo)** |
| **AI Production** | Mistral Large (FR) + **Aleph Alpha (DE)** als Failover |
| **Payments** | Paddle (Merchant-of-Record, IE) |
| **Mail** | Resend EU-Region |
| **Storage** | **keiner** — Modell B (kein File-Storage) |
| **Monitoring** | Sentry self-hosted + Plausible self-hosted |
| **a11y** | WCAG 2.2 **AAA** (vollständige Abdeckung) |
| **Sprachen V1** | DE + EN |

---

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Angular 17 SPA, SSR-ready)                        │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────────┐
│  Caddy 2 (Reverse Proxy, Auto-SSL via Let's Encrypt)        │
└──────────────┬──────────────────────────────────────────────┘
               │
   ┌───────────┴───────────┐
   ▼                       ▼
┌─────────┐         ┌──────────────┐
│ NestJS  │  ◄──►  │ BullMQ Worker │  (AI-Pipeline, PDF-Render)
│ (API)   │         └──────────────┘
└────┬────┘                │
     │                     ▼
     │              ┌────────────┐
     ├─────────────►│ Mistral /  │
     │              │ Claude     │
     │              └────────────┘
     ▼
┌─────────────────┐
│ Postgres + Redis│
└─────────────────┘
```

**Server-Setup:** 1 × IONOS VPS XL 8 (4 vCPU, 8 GB, BSI C5) — alles drauf, Docker-Compose. ~30 €/mo.

---

## 2. Repo-Struktur (kein Monorepo)

```
lebenslauf-agent/
├─ frontend/                 # Angular 21
│  ├─ src/app/
│  │  ├─ core/               # auth, http-interceptors, guards
│  │  ├─ shared/             # ui-kit (Button, Card, Pill, …)
│  │  ├─ features/
│  │  │  ├─ landing/         # Port der Landing-Page
│  │  │  ├─ try/             # anonymer Trial-Flow
│  │  │  ├─ auth/
│  │  │  ├─ dashboard/
│  │  │  ├─ application-editor/
│  │  │  ├─ master-cvs/
│  │  │  ├─ wizard/          # 5-Felder-Quickstart (kein CV)
│  │  │  └─ billing/
│  │  └─ libs/               # shared types (mit Backend dupliziert via Codegen)
│  ├─ tailwind.config.ts
│  └─ angular.json
├─ backend/                  # NestJS
│  ├─ src/
│  │  ├─ auth/               # JWT + Argon2id
│  │  ├─ users/
│  │  ├─ cvs/                # Upload, Parse (RAM-only)
│  │  ├─ jobs/               # Stellenanzeige-Parser, Playwright-Crawler
│  │  ├─ applications/       # Pipeline-Orchestrierung
│  │  ├─ ai/                 # Provider-Abstraktion (Mistral / Claude / Gemini)
│  │  ├─ pdf/                # Puppeteer-Worker, 3 Templates
│  │  ├─ payments/           # Paddle-Webhooks
│  │  ├─ mail/               # Resend
│  │  ├─ gdpr/               # Export, Auto-Purge-Cron
│  │  └─ queue/              # BullMQ Workers
│  └─ test/
├─ infra/
│  ├─ docker-compose.yml     # postgres, redis, caddy, nestjs, worker
│  ├─ Caddyfile
│  └─ deploy.sh              # rsync + restart
└─ docs/
   ├─ Landing Page.html      # 1:1 Visual-Reference
   └─ design-tokens.css
```

---

## 3. Datenmodell (Modell B — kein File-Storage)

```sql
users (id uuid PK, email citext UNIQUE, password_hash text, name text,
       locale text, plan text, paddle_customer_id text,
       email_verified_at timestamptz, created_at, deleted_at)

master_cvs (id uuid PK, user_id uuid FK, name text, language text,
            parsed_json jsonb,           -- ParsedCV-Schema
            source_filename text,        -- nur Anzeige, Datei NICHT gespeichert
            source_hash text,            -- SHA-256 für Dedupe
            created_at, updated_at)

job_postings (id uuid PK, user_id uuid FK, source_type text,
              source_value text, source_hash text INDEX,
              parsed_json jsonb, created_at)

applications (id uuid PK, user_id uuid FK,
              master_cv_id uuid FK, job_posting_id uuid FK,
              status text,                  -- draft|exported|sent|replied|interview|rejected|offer
              match_score int,
              optimized_cv jsonb,
              cover_letter jsonb,           -- {variants: {concise, warm, formal}}
              chosen_variant text,
              chosen_layout text,           -- modern|clean|editorial
              match_report jsonb,
              created_at, exported_at)

charges (id uuid PK, user_id uuid FK, paddle_id text UNIQUE,
         amount_cents int, type text, application_id uuid NULL,
         created_at)

ai_jobs (id uuid PK, application_id uuid FK, type text, state text,
         prompt text, response jsonb, tokens_in int, tokens_out int,
         provider text, error text, created_at, finished_at)

audit_log (id uuid PK, user_id uuid, event text, payload jsonb, created_at)
```

**Was nie persistiert wird:** Original-PDFs, generierte PDFs, virus-scan-Files. Buffers leben max. 60 s im RAM, dann verworfen.

---

## 4. AI-Pipeline

### Provider-Abstraktion

```typescript
// backend/src/ai/provider.ts
interface LLMProvider {
  generate<T>(opts: {
    system: string;
    user: string;
    schema: ZodSchema<T>;
    model?: string;
  }): Promise<T>;
}

// ENV: AI_PROVIDER=mistral (prod) | gemini (pilot) | claude (fallback)
export const ai = {
  mistral: new MistralProvider(env.MISTRAL_API_KEY),
  claude:  new ClaudeProvider(env.ANTHROPIC_API_KEY),
  gemini:  new GeminiProvider(env.GEMINI_API_KEY),
}[env.AI_PROVIDER];
```

### 4 LLM-Calls pro Bewerbung

1. **CV-Parser** → `ParsedCV` (~$0.01)
2. **Job-Parser** → `ParsedJob` (~$0.005)
3. **CV-Optimizer** → `OptimizedCV` mit Source-IDs (~$0.025)
4. **Cover-Letter** (3 Varianten parallel) → `Letters` (~$0.02)

**Match-Scoring** läuft deterministisch in Code (Embeddings + Keyword-Overlap), kostet 0 €.

### Halluzinations-Guards (alle 3 müssen passen)

1. **Schema-Validation** (Zod) auf jedem LLM-Output
2. **Citation-Check:** jeder optimierte Bullet hat `source_id`, Cosine-Sim ≥ 0.65 zum Original
3. **Skill-Whitelist:** keine neuen Skills, die nicht im Original-CV stehen

Bei Fehler → Retry mit strengerem Prompt; nach 3 Fehlversuchen → User-Hinweis "Optimierung nicht möglich".

### Prompts: siehe `prompts/` im Backend-Repo (CV-Parser, Job-Parser, Optimizer, Letter-Generator, Audit-Bot)

---

## 5. Frontend-Architektur (Angular 21)

### Stack-Entscheidungen

- **Standalone Components** (kein NgModule)
- **Signals** für State (kein NgRx)
- **TailwindCSS** + CSS-Variables aus `tokens.css`
- **Reactive Forms** + Zod-Validation (geteilt mit Backend)
- **Angular i18n** (DE primary, EN ab Tag 1)
- **Angular Universal SSR** für Landing/Marketing-Routes
- **GSAP** für Hero-Animationen, Angular Animations für Routenwechsel

### UI-Kit (libs/shared)

- `<lba-button variant size>` · `<lba-pill>` · `<lba-eyebrow>`
- `<lba-card>` · `<lba-score-ring [value]>` · `<lba-keyword-bar>`
- `<lba-cv-block>` · `<lba-diff-block>` (für Editor)
- Alle Komponenten WCAG 2.2 AAA — Focus-States, Kontraste 7:1, Tastatur-Navigation, ARIA-Roles

### Landing-Page-Port

**1:1 Übernahme** der bestehenden `Landing Page.html`:
- `tokens.css` aus `<style>`-Block extrahieren → global eingebunden
- Jede JSX-Komponente → Angular Standalone Component (gleiche Props, gleiches Markup)
- `useReveal()` IntersectionObserver → `appReveal`-Directive
- Tweaks-Panel entfernen (war Design-Exploration)
- SSR aktivieren für `/`, `/preise`, `/legal/*`

---

## 6. Backend-Architektur (NestJS)

### Module

```
auth/      — POST /auth/register, /auth/login, /auth/refresh, /auth/verify-email
users/     — GET /me, PATCH /me, DELETE /me (soft → hard nach 30d)
cvs/       — POST /cvs (multipart, RAM-only), GET /cvs, PATCH /cvs/:id
jobs/      — POST /jobs/parse {url|text|image|pdf}
applications/ — POST /applications, GET /applications/:id, /:id/stream (SSE),
                /:id/regenerate-letter, /:id/export, /:id/email-to-self
ai/        — interne Pipeline-Services
pdf/       — interne Render-Services (Puppeteer + 3 Templates)
payments/  — Paddle-Webhooks (purchase.completed, subscription.*)
mail/      — Resend-Integration
gdpr/      — GET /gdpr/export (ZIP), Cron für 30-Tage-Purge
```

### Auth-Flow — siehe § 22 für Details

### Rate-Limits (Redis)

- `/cvs` Upload: 5/h pro User
- `/applications`: 5/h free, 50/h Pro
- `/jobs/parse` URL-Crawl: 20/h pro User
- `/auth/login`: 10/15min pro IP

---

## 7. CV-Eingabe & Wizard

### Akzeptierte Upload-Formate
- PDF (`pdf-parse`)
- DOCX (`mammoth`)
- ODT (`odt2html` → Text)
- LinkedIn-PDF-Export (Sonderlogik für LinkedIn-Layout)
- Plain Text einfügen

### 5-Felder-Quickstart-Wizard (für Leute ohne CV)

```typescript
interface WizardInput {
  name: string;
  currentRoleOrStudium: string;     // "Studentin Wirtschaftsinformatik, 6. Semester"
  topSkills: string[];               // 3–5 Skills
  language: 'de' | 'en';
  targetRole: string;                // "Frontend Developer Junior"
}
```

→ AI generiert daraus ein **vollständiges `ParsedCV`-Skeleton**, das der User danach im Editor mit echten Erfahrungen ausfüllt. Spart 80 % der Wizard-Komplexität.

---

## 8. Stellenanzeigen-Eingabe (4 Methoden)

| Methode | Implementation |
|---|---|
| Plain Text | direkt an Job-Parser |
| URL | Playwright (Headless) → Readability.js → Text → Parser |
| Screenshot | Multimodaler LLM-Call (Claude oder Gemini Vision) |
| PDF | `pdf-parse` → Text → Parser |

---

## 9. CV-Layouts (3 in V1)

Alle Templates: server-rendered Angular Universal → HTML → Puppeteer → PDF, on-demand bei jedem Download.

| Template | Stil | ATS-Score |
|---|---|---|
| **Modern** | zweispaltig, oklch-Akzent, Geist Sans | hoch |
| **Clean** | einspaltig, klassisch, ATS-safe | sehr hoch |
| **Editorial** | großes Whitespace, Display-Typo | mittel |

User bekommt **immer beide Ausgaben** (gewähltes Layout + Clean als ATS-Fallback) als ZIP.

---

## 10. Editor & Bearbeitungs-Tiefe

**Inline-Edit jedes Bullets als Textfeld + „KI-Vorschlag annehmen/verwerfen"-Button.**

```
┌─────────────────────────────────────────────────┐
│ Erfahrung — Frontend Praktikant @ Mediahaus    │
├─────────────────────────────────────────────────┤
│ Original (editierbar):                          │
│ [ Habe an Webseiten mitgearbeitet, JS-Frameworks ] │
│                                                  │
│ ✦ KI-Vorschlag:                                 │
│ Migration der Marketing-Site auf Next.js 14,    │
│ Lighthouse 62 → 96.                             │
│   [✓ Übernehmen]  [✗ Verwerfen]  [✏ Anpassen]  │
└─────────────────────────────────────────────────┘
```

---

## 11. Versand-Funktion (Variante b + c kombiniert)

1. **„An mich senden"-Button:** PDFs gehen per Resend an die User-E-Mail (zum Weiterleiten)
2. **„In E-Mail-Programm öffnen"-Button:** `mailto:`-Link mit:
   - Empfänger: vom User einzugeben
   - Betreff: vorgeneriert ("Bewerbung als {role}")
   - Body: Anschreiben-Vorschau
   - Anhang: Hinweis "PDFs aus Anhängen anhängen" (mailto unterstützt keine Attachments)

→ Kein SMTP-Relay nötig, kein Spam-Risiko, datenschutzfreundlich.

---

## 12. Dashboard-Funktionen V1

- ✅ Liste aller Bewerbungen mit Match-Score und Status
- ✅ Status-Tracking (gesendet/Antwort/Interview/Absage/Angebot)
- ✅ Master-CV-Verwaltung (mehrere CVs pro User, z. B. „Tech DE", „Tech EN")
- ✅ Mehrsprachige CV-Versionen (DE + EN)
- ✅ Versand: An-mich + Mailto
- ✅ Follow-up-Vorlagen (3 Templates: Erinnerung, Status-Anfrage, Dank)
- ✅ LinkedIn-Profil-Optimierung (User pasted Profil-Text, ohne API)

**Nicht in V1:** LinkedIn-API, Indeed-API, Xing-API, Browser-Extension.

---

## 13. WCAG 2.2 AAA — was das konkret heißt

| Anforderung | Umsetzung |
|---|---|
| Kontrast 7:1 für Text | Token `--ink: oklch(20% …)` auf `--bg: oklch(98.6% …)` ergibt 17:1 ✓ |
| Kontrast 4.5:1 für Large-Text | gegeben |
| Tastatur-Navigation komplett | `tabindex`, sichtbare Focus-Rings (3px Outline) |
| Screen-Reader-Support | `aria-label`, `aria-live` für Pipeline-Progress, `<output>`-Tags |
| Bewegung pausierbar | `prefers-reduced-motion` respektieren, alle Animationen unter 5s |
| Keine Text-Bilder | Alles via SVG-Icons + echtem Text |
| Sprache markiert | `lang="de"` / `lang="en"` auf Root |
| Form-Labels | jedes Input mit `<label>` + `aria-describedby` für Errors |
| Skip-Links | „Zum Hauptinhalt springen" am Seiten-Anfang |
| Audit | axe-core in jeder E2E-Run; manueller VoiceOver/NVDA-Test vor Launch |

**Test-Stack:** axe-core + Playwright + Lighthouse a11y-Audit (Ziel: 100/100).

---

## 14. DSGVO & Datenschutz

| Anforderung | Umsetzung |
|---|---|
| Datenresidenz | Hetzner Falkenstein (DE), Postgres lokal, kein S3 |
| Originaldateien | werden **nicht** persistiert (RAM-only) |
| Auto-Purge | 30 Tage nach letztem Login → Soft-Delete; nach weiteren 30 Tagen Hard-Delete |
| Datenexport | `/gdpr/export` → ZIP mit JSON aller Tabellen + alle PDFs frisch gerendert |
| Recht auf Löschung | sofortiger Soft-Delete via `DELETE /me`, Cron räumt nach 30d |
| AVV | mit Resend, Paddle, Mistral, Anthropic — alle abgeschlossen vorab |
| Cookies | nur essenzielle (Session). Plausible cookielos. Kein Cookie-Banner nötig. |
| Datenschutzerklärung | nach DSK-Mustertext, anwaltlich geprüft (~1 500 €) |
| Impressum | TMG/MStV-konform |

---

## 15. Payments (Paddle)

- **Produkte:**
  - `pri_pay_per_app` — 4,90 € (Einmal)
  - `pri_pro_monthly` — 14 €/mo
  - `pri_pro_yearly` — 130 €/Jahr (~22 % Rabatt)
- Paddle übernimmt **alle Steuern** (MwSt. EU + USt-Reverse-Charge), Rechnungsstellung
- Money-Back-Garantie: Match-Score < 80 % → automatischer Refund-Webhook
- **Webhooks:** `transaction.completed`, `subscription.activated`, `subscription.canceled`

---

## 16. Monitoring

- **Sentry self-hosted** auf gleichem Hetzner-Server (Docker) — Error-Tracking FE+BE
- **Plausible self-hosted** — cookielos, EU
- **Better Stack Free Tier** — Uptime-Pings (5min)
- **AI-Quality-Dashboard** — Daily Cron: Schema-Failures, Halluzinations-Flags, Score-Drift

---

## 17. Tests

- **Unit:** Vitest (FE), Jest (BE) — Ziel ≥ 70 % Coverage in `services/`
- **Component:** Angular Testing Library
- **E2E:** Playwright — Try, Pay, Login, Editor, Export
- **a11y:** axe-core in jedem E2E-Run, Lighthouse a11y 100/100 Pflicht
- **AI-Eval:** 50 Fixture-CV+Job-Pärchen, nightly Run, Drift-Alarm bei > 5 %

---

## 18. Roadmap (3,5 Monate Solo)

| Woche | Inhalt | Deliverable |
|---|---|---|
| **0** | Hetzner-Setup, Domain, Caddy, Postgres, Repo-Setup, CI (GitHub Actions) | Server live, „hello world" auf Domain |
| **1** | Angular-Skeleton + Tailwind + Tokens + Landing-Page-Port (1:1) | Landing live, SEO-fähig |
| **2** | Auth-Modul (BE + FE): Register/Login/Verify, JWT, Cookie-Handling | Login funktioniert |
| **3** | CV-Upload + Pipeline-Stub (Mock-Antworten) + Try-Flow | End-to-End mit Mocks |
| **4** | AI-Pipeline echt: Gemini-Free + Mistral, alle 4 Calls + Halluzinations-Guards | Echte Optimierung läuft |
| **5** | Editor mit Diff-View + Inline-Edit, „Übernehmen/Verwerfen" | Editor benutzbar |
| **6** | PDF-Renderer + 3 Templates (Modern/Clean/Editorial) | PDF-Download funktioniert |
| **7** | Wizard (5-Felder) + Job-Eingabe (URL+Screenshot+PDF) | Alle Eingabemodi |
| **8** | Dashboard + Master-CVs + Status-Tracking + Mehrsprachigkeit | App-Komplettheit |
| **9** | Paddle-Integration + Webhook + Money-Back-Logik | Bezahlung funktioniert |
| **10** | DSGVO-Export + Auto-Purge-Cron + Datenschutzerklärung-Anwalt | Rechtlich sauber |
| **11** | a11y-Audit (axe + manuelles VoiceOver), WCAG-AAA-Fixes | a11y 100/100 |
| **12** | Mail-Funktion (An-mich + Mailto), Follow-up-Vorlagen, LinkedIn-Optimierung | Feature-Complete |
| **13** | Pen-Test light, Sentry/Plausible scharf, Beta-Test mit 20 Leuten | Beta-Launch |
| **14** | Bug-Fix, Polish, Marketing-Setup | **Public Launch** |

**Bei 25–30 h/Woche realistisch.** Bei 40 h/Woche: 11 Wochen.

---

## 19. Kosten Solo-Pilot (erste 6 Monate)

| Posten | Pro Monat |
|---|---|
| IONOS VPS XL 8 + Backups | 35 € |
| Domain + SSL | 1 € |
| Resend (50k Mails free) | 0 € |
| Plausible self-hosted | 0 € |
| Sentry self-hosted | 0 € |
| Mistral Free Tier (Pilot ~200 Bewerbungen) | 0 € |
| Better Stack Free | 0 € |
| **Pro Monat** | **~60 €** |
| **Anwaltliche DSGVO-Prüfung** (einmalig) | 1 500 € |
| **Pen-Test light** (einmalig) | 1 500 € |

**Gesamt erste 6 Monate:** ~3 400 €. Bei 30 zahlenden Pro-Usern (420 € MRR) bereits profitabel.

---

## 20. Offene Punkte zum späteren Klären

1. **Rechtsform** — Einzelunternehmen für V1 ausreichend; GmbH erst ab >50k Umsatz oder Investoren. **Anwalt fragen vor Launch.**
2. **Domain** — noch zu wählen (Vorschläge: `lebenslauf-agent.de`, `bewerbung-passt.de`, `cvgen.de`).
3. **Marketing-Plan** — nicht Teil dieser Spec; LinkedIn-Posts + IndieHackers-Launch + Reddit-Subs sind Solo-tauglich.
4. **Backup-Strategie** — Hetzner Backup-Volume + täglicher pg_dump nach R2 separat (nur SQL-Dump, keine User-Files).
5. **LinkedIn-/Indeed-/Xing-API** — V2.0-Feature, sobald 100 zahlende User erreicht.

---

## 21. Endgültige Architektur-Entscheidungen (lock!)

| Entscheidung | Wert |
|---|---|
| Frontend | Angular 21 Standalone, klassisches Repo |
| Backend | NestJS (Node 20) |
| DB | Postgres 16 self-hosted Hetzner |
| Auth | self-built JWT + Argon2id |
| Storage | **kein** File-Storage |
| AI Pilot | **Mistral Free Tier (EU)** |
| AI Prod | Mistral Large + Aleph Alpha (DE) Failover |
| Payments | Paddle |
| Mail | Resend |
| Hosting | IONOS Cloud (BSI C5), Docker-Compose |
| a11y | WCAG 2.2 AAA (Pflicht) |
| Sprachen | DE + EN |
| Live-Editor | Inline-Edit + Take-it-or-leave-it |
| Layouts | 3 (Modern, Clean, Editorial) |
| Versand | An-mich + Mailto |
| Wizard | 5-Felder-Quickstart |
| Repo-Struktur | Frontend/Backend getrennt im selben Git-Repo |

---

> **Nächster Schritt:** Server provisionieren (IONOS-Account + Domain), Repo erstellen, Phase 0 starten.

---

## 22. Authentifizierung & Autorisierung (Detail)

### 22.1 Authentifizierung — Wer bist du?

**Endpunkte:**

| Route | Funktion |
|---|---|
| `POST /auth/register` | Email + Passwort, Argon2id (memCost 65536, time 3, parallelism 4), Verify-Mail (24h Token) |
| `GET /auth/verify?token=` | setzt `email_verified_at`, redirect /login |
| `POST /auth/login` | Rate 10/15min/IP+Email, Lockout nach 5 Fehlversuchen (15min), HIBP-k-Anonymity-Check |
| `POST /auth/refresh` | Rotation, Reuse-Detection → revoke ALL Sessions |
| `POST /auth/logout` | Refresh-Token blacklisten (Redis), Cookie clearen |
| `POST /auth/forgot-password` | Generic-Response (kein Hint ob Mail existiert), 1h Token |
| `POST /auth/reset-password` | Token + neues Passwort |
| `POST /auth/2fa/enable` | TOTP, QR + 10 Backup-Codes (optional, Pro-User empfohlen) |
| `POST /auth/2fa/verify` | bei Login zweiter Schritt |

**Token-Strategie:**
- **Access-Token:** JWT, **EdDSA (Ed25519)**, 15 min Lifetime, in Memory (kein localStorage!)
- **Refresh-Token:** Opaque random (32 Bytes), 30d, **HttpOnly + Secure + SameSite=Lax** Cookie
- **Rotation:** jeder Refresh-Use → neuer Token, alter blacklisted in Redis
- **Reuse-Detection:** alter Token nochmal verwendet → Token-Theft erkannt → ALLE Sessions des Users revoken + Mail an User
- **Concurrent Sessions:** max 5 aktive Refresh-Tokens, älteste rausschmeißen

**JWT-Payload:**
```json
{ "sub": "uuid", "plan": "pro", "ev": true, "tfa": false,
  "iat": 1715169600, "exp": 1715170500, "jti": "uuid" }
```

**Passwort-Policy (NIST 800-63B):**
- min 12 Zeichen, **kein** Komplexitäts-Zwang
- HIBP-Pwned-Check via k-Anonymity
- `autocomplete="new-password"` für Passwort-Manager

### 22.2 Autorisierung — Was darfst du?

**Drei Schichten:**

```
1. Route-Guard       → eingeloggt?
2. Plan-Gate         → richtiger Plan?
3. Resource-Owner    → gehört dir die Ressource?
```

**Rollen & Pläne:**
```typescript
enum Role { USER, ADMIN }
enum Plan { FREE, PAY_PER_APP, PRO }
```

**NestJS-Guards:**
```typescript
@UseGuards(JwtAuthGuard)                                    // 1
@UseGuards(JwtAuthGuard, PlanGuard) @RequirePlan(Plan.PRO)  // 2
@UseGuards(JwtAuthGuard, OwnsApplicationGuard)              // 3
```

**Angular 21 Functional Guards:**
```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};
export const planGuard = (p: Plan): CanActivateFn => () =>
  inject(AuthService).user().plan === p;
```

### 22.3 Session- & Account-Sicherheit

| Maßnahme | Umsetzung |
|---|---|
| CSRF | Double-Submit-Cookie + CSRF-Header für mutating Requests |
| XSS | strict CSP, kein `innerHTML`, AI-Output via `DomSanitizer` |
| Clickjacking | `X-Frame-Options: DENY` |
| Session-Timeout | 30 min Inaktivität → silent Refresh oder Logout |
| Device-Tracking | UA + IP-Hash in `sessions`-Tabelle, „Aktive Geräte" im Profil |
| Suspicious Login | neue IP-Region → Mail-Notification |
| Audit-Log | jeder Auth-Event in `audit_log` |
| 2FA für Admin | **Pflicht** |
| 2FA für Pro-User | optional, sehr empfohlen |

---

## 23. Sicherheit (über Auth hinaus)

| Bereich | Maßnahme |
|---|---|
| HTTP-Header | Helmet.js — strict CSP, HSTS, Referrer-Policy `no-referrer`, X-Content-Type-Options `nosniff` |
| File-Upload | Magic-Byte-Check (PDF `%PDF-`, DOCX `PK\x03\x04`), max 10 MB, MIME-Sniff-Schutz |
| Prompt-Injection | System-Prompt + Delimiter `<<<JOB_AD>>>...<<<END>>>`, User-Input getrennt |
| AI-Output-Sanitization | `sanitize-html` vor PDF-Render und Editor-Display |
| Dependency-Scanning | GitHub Dependabot + Snyk Free, wöchentlich |
| `security.txt` | unter `/.well-known/security.txt` mit Kontakt |
| AI-Cost-Limit | Free 1 Bewerbung/24h, Pro 10/24h (Abuse-Schutz) |
| Pen-Test | extern, light-version, vor Public-Launch (~1 500 €) |
| Bug-Bounty | Hall-of-Fame-Liste auf `/security`, kein Geld V1 |

---

## 24. Cookies & TTDSG

**TTDSG § 25 Abs. 2 Nr. 2 — Ausnahme „unbedingt erforderlich":**

| Cookie | Zweck | Consent? |
|---|---|---|
| `__Host-session` (Refresh-Token) | Login | nein, technisch erforderlich |
| `__Host-csrf` | CSRF-Schutz | nein, technisch erforderlich |
| Plausible | Analytics | **cookielos** → nein |
| **Crisp Chat** | Customer-Support | **JA, Consent erforderlich** |

→ **Cookie-Banner zwingend, sobald Crisp aktiv ist.**

**Banner-Architektur:**
- Eigenbau, kein Cookiebot/Usercentrics (DSGVO-konform aber Lock-in)
- 3 Buttons: „Alle akzeptieren" / „Nur notwendige" / „Einstellungen"
- Default: **alle nicht-notwendigen Cookies aus** (Privacy-by-Default Art. 25)
- State in `localStorage` (`consent_v1`)
- Crisp-Skript nur laden wenn `consent.support === true`
- jährliches Re-Consent (alter Banner-Code wird ungültig)
- jederzeit widerrufbar via Footer-Link „Cookie-Einstellungen"

**Implementierung:** Angular Service `ConsentService` mit Signal `consent()`, alle Drittanbieter-Skripte laden lazy via `effect()`.

---

## 25. Datenschutz für Art.-9-Daten (Schutzkonzept)

### 25.1 Warum besonders heikel
CVs enthalten oft besondere Kategorien nach Art. 9 DSGVO: Bewerbungsfoto (ethnische Herkunft), Gesundheit (Schwerbehinderung, Lücken), Religion (kirchliche AG), Gewerkschaft, politische Einstellung, sex. Orientierung (Vereine).

### 25.2 Verpflichtende Maßnahmen

| Maßnahme | Umsetzung |
|---|---|
| **DSFA** (Art. 35) | Pflicht — Trigger: AI-Profiling + Art-9 + neue Tech. Vorlage BfDI, vor Launch dokumentiert |
| **VVT** (Art. 30) | Tabelle aller Verarbeitungen, Vorlage GDD, einmalig ~3h |
| **Ausdrückliche Einwilligung** (Art. 9 Abs. 2 lit. a) | separate Checkbox vor Upload, kein Pre-Tick, jederzeit widerrufbar |
| **Anonymisierungs-Toggle** im Editor | Foto entfernen, Religion/Gewerkschaft/Politik-Felder maskieren — **default: Foto behalten, sensible Felder ausgeblendet** |
| **Datenminimierung-Hinweis** vor Upload | „Foto, Familienstand, Religion sind in DE optional" |
| **Original-Datei nie persistiert** | RAM-only, max 60s |
| **AI-Prompts/Responses Löschfrist** | 30 Tage (war länger, gekürzt) |
| **Drittland-Verarbeitung** | nur EU: Mistral (FR), Aleph Alpha (DE) — **kein** Claude/Gemini für Art-9 |
| **AVV** | mit Mistral, Aleph Alpha, Resend, Paddle, IONOS — alle vor Go-Live |
| **DPO extern** | empfohlen, ~150 €/mo (Art. 9 + AI = best practice) |
| **Datenschutzerklärung** | anwaltlich geprüft (~1 500 €), nicht Template |
| **Datenpannen-Meldeprozess** | Art. 33: 72h-Frist BfDI, Template + Playbook vorbereitet |

### 25.3 Foto-Behandlung im Editor

```
┌────────────────────────────────────────────┐
│ Foto im optimierten Lebenslauf            │
├────────────────────────────────────────────┤
│  ◉ Behalten                                │
│  ○ Anonymisieren (entfernen)              │
│                                            │
│ ℹ Anonyme Bewerbungen sind im öffentlichen │
│   Dienst Deutschland Standard und können  │
│   Bias reduzieren.                        │
└────────────────────────────────────────────┘
```

### 25.4 Bias-Testing
- 10 CV-Varianten (Name, Foto, Adresse) mit gleicher Substanz
- Match-Score-Variation messen, Drift > 5 % → Alert
- nightly via GitHub Actions

---

## 26. Operations, CI/CD & Recht (Restpunkte)

### 26.1 CI/CD
- **GitHub Actions:** Lint → Test → axe a11y → Build → Deploy via SSH (rsync + `docker compose up`)
- **Staging:** 2. IONOS-VPS klein (~10 €/mo), getrennte DB, Test-Paddle-Sandbox
- **Migrations:** Prisma Migrate, jede Migration im PR reviewbar
- **Secrets:** Doppler (Free Tier) ODER `.env.production` mit `chmod 600`

### 26.2 Backup & Disaster Recovery
- pg_dump täglich → IONOS Object Storage, gpg-verschlüsselt, 30d Retention
- monatlicher Restore-Test (dokumentiert!)
- RTO 4h, RPO 24h
- Backup-Bucket in **anderer Region** als Hauptserver (Karlsruhe ↔ Berlin)

### 26.3 Monitoring & Logging
- Sentry self-hosted (Errors)
- Plausible self-hosted (Analytics, cookielos)
- Better Stack Free (Uptime, 60s Pings)
- pino strukturierte Logs → Datei-Rotation → 30d → gpg-Archiv (Compliance)
- `/health`-Endpoint: DB-Ping, Redis, Mistral-Ping
- AI-Quality-Dashboard: Schema-Failures, Halluzinations-Flags, Cost/User

### 26.4 Email-Infrastruktur
- Resend EU-Region
- SPF, DKIM, DMARC Records für Domain
- Templates via React-Email: Welcome, Verify, Reset, Receipt, Bewerbung-Fertig, Sicherheits-Alerts
- Domain-Subdomains: `app.`, `api.`, `mail.`, `status.`

### 26.5 Customer Support
- **Crisp** (Free 1-Operator, EU-Server) → Cookie-Banner-Pflicht
- `support@domain.de` Mailbox
- FAQ-Seite mit `<details>` strukturiert
- NPS-Survey nach Export

### 26.6 Recht (Vollständigkeitscheck)

| Punkt | Status / To-do |
|---|---|
| AGB | Anwalt, ~500 € |
| Datenschutzerklärung | Anwalt, ~1 500 € |
| Impressum | TMG/MStV-konform |
| Widerrufsbelehrung B2C 14d | digitale Inhalte: Erlöschen nach Lieferung **nur** mit ausdr. Zustimmung |
| VSBG-Hinweis | „Wir nehmen nicht teil" |
| BFSG (seit 28.06.2025) | mit WCAG 2.2 AAA übererfüllt |
| Steuer | §19 UStG bis 22 000 €, dann Regelbesteuerung |
| Rechtsform | Einzelunternehmen V1, GmbH ab 50 k€/Investoren |
| AGG-Bias-Test | siehe § 25.4 |

### 26.7 Was nicht vergessen wurde
- Domain-Wahl + WHOIS-Privacy
- Onboarding-Tour (3 Tooltips beim ersten Login)
- Empty-States, Loading-Skeletons (nicht Spinner)
- Error-Pages 404/500 deutsche Tonalität
- SEO-Basics: sitemap.xml, robots.txt, OG-Tags, structured data
- Discount-Codes: `STUDENT20`, `LAUNCH10`
- Beta-Tester: 20 aus Studenten-FB-Gruppen, Reddit r/de_EDV, Uni Career-Centers

---

## 27. Roadmap-Anpassung (14–16 Wochen statt 13–14)

Zusätzliche Aufwände durch Art-9-Schutz, AAA-a11y, Cookie-Banner, Crisp-Integration, Bias-Testing, DSFA:

| Woche | Zusätzlicher Inhalt |
|---|---|
| 0 | + Cookie-Banner-Komponente, Consent-Service |
| 4 | + Prompt-Injection-Defense, AI-Output-Sanitizer |
| 10 | + DSFA-Dokument schreiben, VVT befüllen |
| 11 | + Bias-Testing-Suite, Anonymisierungs-Toggle |
| 13 | + Crisp-Integration nach Consent, AGB+DSE-Anwaltsreview |
| 14–15 | Puffer, Beta-Feedback |
| 16 | **Public Launch** |

---

> **Status:** Spec V1.0 final, alle Architektur-Entscheidungen gelockt.
