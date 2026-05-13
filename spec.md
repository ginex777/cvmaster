# Lebenslauf-Agent â€” Finale Spezifikation V1.0

> Konsolidiert aus Architektur-Interview Â· Solo-Dev Â· 3â€“4 Monate Â· Strict EU Â· WCAG 2.2 AAA

---

## 0. Eckdaten

| | |
|---|---|
| **Team** | 1 Person (Solo) |
| **Timeline** | 3â€“4 Monate bis erstem zahlenden User |
| **Hosting** | **IONOS Cloud (Berlin/Karlsruhe, BSI C5 Typ 2)** â€” Strict EU |
| **Frontend** | **Angular 21** Standalone, **Zoneless**, **Signal-based Forms** â€” klassisches Repo |
| **Backend** | NestJS (Node 20, TypeScript) |
| **DB** | PostgreSQL 16 self-hosted (IONOS VPS XL 8) |
| **Cache/Queue** | Redis 7 (BullMQ) |
| **Auth** | Self-hosted JWT (Ed25519) + Argon2id, optionales TOTP-2FA |
| **AI Pilot** | **Groq API** |
| **AI Production** | Groq primary + **Claude** fallback |
| **Payments** | Paddle (Merchant-of-Record, IE) |
| **Mail** | Resend EU-Region |
| **Storage** | **keiner** â€” Modell B (kein File-Storage) |
| **Monitoring** | Sentry self-hosted + Plausible self-hosted |
| **a11y** | WCAG 2.2 **AAA** (vollstÃ¤ndige Abdeckung) |
| **Sprachen V1** | DE + EN |

---

## 1. Architektur-Ãœbersicht

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Browser (Angular 17 SPA, SSR-ready)                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚ HTTPS
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Caddy 2 (Reverse Proxy, Auto-SSL via Let's Encrypt)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â–¼                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ NestJS  â”‚  â—„â”€â”€â–º  â”‚ BullMQ Worker â”‚  (AI-Pipeline, PDF-Render)
â”‚ (API)   â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜                â”‚
     â”‚                     â–¼
     â”‚              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
     â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ Groq /     â”‚
     â”‚              â”‚ Claude     â”‚
     â”‚              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Postgres + Redisâ”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Server-Setup:** 1 Ã— IONOS VPS XL 8 (4 vCPU, 8 GB, BSI C5) â€” alles drauf, Docker-Compose. ~30 â‚¬/mo.

---

## 2. Repo-Struktur (kein Monorepo)

```
lebenslauf-agent/
â”œâ”€ frontend/                 # Angular 21
â”‚  â”œâ”€ src/app/
â”‚  â”‚  â”œâ”€ core/               # auth, http-interceptors, guards
â”‚  â”‚  â”œâ”€ shared/             # ui-kit (Button, Card, Pill, â€¦)
â”‚  â”‚  â”œâ”€ features/
â”‚  â”‚  â”‚  â”œâ”€ landing/         # Port der Landing-Page
â”‚  â”‚  â”‚  â”œâ”€ try/             # anonymer Trial-Flow
â”‚  â”‚  â”‚  â”œâ”€ auth/
â”‚  â”‚  â”‚  â”œâ”€ dashboard/
â”‚  â”‚  â”‚  â”œâ”€ application-editor/
â”‚  â”‚  â”‚  â”œâ”€ master-cvs/
â”‚  â”‚  â”‚  â”œâ”€ wizard/          # 5-Felder-Quickstart (kein CV)
â”‚  â”‚  â”‚  â””â”€ billing/
â”‚  â”‚  â””â”€ libs/               # shared types (mit Backend dupliziert via Codegen)
â”‚  â”œâ”€ tailwind.config.ts
â”‚  â””â”€ angular.json
â”œâ”€ backend/                  # NestJS
â”‚  â”œâ”€ src/
â”‚  â”‚  â”œâ”€ auth/               # JWT + Argon2id
â”‚  â”‚  â”œâ”€ users/
â”‚  â”‚  â”œâ”€ cvs/                # Upload, Parse (RAM-only)
â”‚  â”‚  â”œâ”€ jobs/               # Stellenanzeige-Parser, Playwright-Crawler
â”‚  â”‚  â”œâ”€ applications/       # Pipeline-Orchestrierung
â”‚  â”‚  â”œâ”€ ai/                 # Provider-Abstraktion (Groq / Claude)
â”‚  â”‚  â”œâ”€ pdf/                # Puppeteer-Worker, 3 Templates
â”‚  â”‚  â”œâ”€ payments/           # Paddle-Webhooks
â”‚  â”‚  â”œâ”€ mail/               # Resend
â”‚  â”‚  â”œâ”€ gdpr/               # Export, Auto-Purge-Cron
â”‚  â”‚  â””â”€ queue/              # BullMQ Workers
â”‚  â””â”€ test/
â”œâ”€ infra/
â”‚  â”œâ”€ docker-compose.yml     # postgres, redis, caddy, nestjs, worker
â”‚  â”œâ”€ Caddyfile
â”‚  â””â”€ deploy.sh              # rsync + restart
â””â”€ docs/
   â”œâ”€ Landing Page.html      # 1:1 Visual-Reference
   â””â”€ design-tokens.css
```

---

## 3. Datenmodell (Modell B â€” kein File-Storage)

```sql
users (id uuid PK, email citext UNIQUE, password_hash text, name text,
       locale text, plan text, paddle_customer_id text,
       email_verified_at timestamptz, created_at, deleted_at)

master_cvs (id uuid PK, user_id uuid FK, name text, language text,
            parsed_json jsonb,           -- ParsedCV-Schema
            source_filename text,        -- nur Anzeige, Datei NICHT gespeichert
            source_hash text,            -- SHA-256 fÃ¼r Dedupe
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

// ENV: AI_PROVIDER=groq (prod) | gemini (pilot) | claude (fallback)
export const ai = {
  groq:    new GroqProvider(env.GROQ_API_KEY),
  claude:  new ClaudeProvider(env.ANTHROPIC_API_KEY),
  gemini:  new GeminiProvider(env.GEMINI_API_KEY),
}[env.AI_PROVIDER];
```

### 4 LLM-Calls pro Bewerbung

1. **CV-Parser** â†’ `ParsedCV` (~$0.01)
2. **Job-Parser** â†’ `ParsedJob` (~$0.005)
3. **CV-Optimizer** â†’ `OptimizedCV` mit Source-IDs (~$0.025)
4. **Cover-Letter** (3 Varianten parallel) â†’ `Letters` (~$0.02)

**Match-Scoring** lÃ¤uft deterministisch in Code (Embeddings + Keyword-Overlap), kostet 0 â‚¬.

### Halluzinations-Guards (alle 3 mÃ¼ssen passen)

1. **Schema-Validation** (Zod) auf jedem LLM-Output
2. **Citation-Check:** jeder optimierte Bullet hat `source_id`, Cosine-Sim â‰¥ 0.65 zum Original
3. **Skill-Whitelist:** keine neuen Skills, die nicht im Original-CV stehen

Bei Fehler â†’ Retry mit strengerem Prompt; nach 3 Fehlversuchen â†’ User-Hinweis "Optimierung nicht mÃ¶glich".

### Prompts: siehe `prompts/` im Backend-Repo (CV-Parser, Job-Parser, Optimizer, Letter-Generator, Audit-Bot)

---

## 5. Frontend-Architektur (Angular 21)

### Stack-Entscheidungen

- **Standalone Components** (kein NgModule)
- **Signals** fÃ¼r State (kein NgRx)
- **TailwindCSS** + CSS-Variables aus `tokens.css`
- **Reactive Forms** + Zod-Validation (geteilt mit Backend)
- **Angular i18n** (DE primary, EN ab Tag 1)
- **Angular Universal SSR** fÃ¼r Landing/Marketing-Routes
- **GSAP** fÃ¼r Hero-Animationen, Angular Animations fÃ¼r Routenwechsel

### UI-Kit (libs/shared)

- `<lba-button variant size>` Â· `<lba-pill>` Â· `<lba-eyebrow>`
- `<lba-card>` Â· `<lba-score-ring [value]>` Â· `<lba-keyword-bar>`
- `<lba-cv-block>` Â· `<lba-diff-block>` (fÃ¼r Editor)
- Alle Komponenten WCAG 2.2 AAA â€” Focus-States, Kontraste 7:1, Tastatur-Navigation, ARIA-Roles

### Landing-Page-Port

**1:1 Ãœbernahme** der bestehenden `Landing Page.html`:
- `tokens.css` aus `<style>`-Block extrahieren â†’ global eingebunden
- Jede JSX-Komponente â†’ Angular Standalone Component (gleiche Props, gleiches Markup)
- `useReveal()` IntersectionObserver â†’ `appReveal`-Directive
- Tweaks-Panel entfernen (war Design-Exploration)
- SSR aktivieren fÃ¼r `/`, `/preise`, `/legal/*`

---

## 6. Backend-Architektur (NestJS)

### Module

```
auth/      â€” POST /auth/register, /auth/login, /auth/refresh, /auth/verify-email
users/     â€” GET /me, PATCH /me, DELETE /me (soft â†’ hard nach 30d)
cvs/       â€” POST /cvs (multipart, RAM-only), GET /cvs, PATCH /cvs/:id
jobs/      â€” POST /jobs/parse {url|text|image|pdf}
applications/ â€” POST /applications, GET /applications/:id, /:id/stream (SSE),
                /:id/regenerate-letter, /:id/export, /:id/email-to-self
ai/        â€” interne Pipeline-Services
pdf/       â€” interne Render-Services (Puppeteer + 3 Templates)
payments/  â€” Paddle-Webhooks (purchase.completed, subscription.*)
mail/      â€” Resend-Integration
gdpr/      â€” GET /gdpr/export (ZIP), Cron fÃ¼r 30-Tage-Purge
```

### Auth-Flow â€” siehe Â§ 22 fÃ¼r Details

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
- ODT (`odt2html` â†’ Text)
- LinkedIn-PDF-Export (Sonderlogik fÃ¼r LinkedIn-Layout)
- Plain Text einfÃ¼gen

### 5-Felder-Quickstart-Wizard (fÃ¼r Leute ohne CV)

```typescript
interface WizardInput {
  name: string;
  currentRoleOrStudium: string;     // "Studentin Wirtschaftsinformatik, 6. Semester"
  topSkills: string[];               // 3â€“5 Skills
  language: 'de' | 'en';
  targetRole: string;                // "Frontend Developer Junior"
}
```

â†’ AI generiert daraus ein **vollstÃ¤ndiges `ParsedCV`-Skeleton**, das der User danach im Editor mit echten Erfahrungen ausfÃ¼llt. Spart 80 % der Wizard-KomplexitÃ¤t.

---

## 8. Stellenanzeigen-Eingabe (4 Methoden)

| Methode | Implementation |
|---|---|
| Plain Text | direkt an Job-Parser |
| URL | Playwright (Headless) â†’ Readability.js â†’ Text â†’ Parser |
| Screenshot | Multimodaler LLM-Call (Claude oder Gemini Vision) |
| PDF | `pdf-parse` â†’ Text â†’ Parser |

---

## 9. CV-Layouts (3 in V1)

Alle Templates: server-rendered Angular Universal â†’ HTML â†’ Puppeteer â†’ PDF, on-demand bei jedem Download.

| Template | Stil | ATS-Score |
|---|---|---|
| **Modern** | zweispaltig, oklch-Akzent, Geist Sans | hoch |
| **Clean** | einspaltig, klassisch, ATS-safe | sehr hoch |
| **Editorial** | groÃŸes Whitespace, Display-Typo | mittel |

User bekommt **immer beide Ausgaben** (gewÃ¤hltes Layout + Clean als ATS-Fallback) als ZIP.

---

## 10. Editor & Bearbeitungs-Tiefe

**Inline-Edit jedes Bullets als Textfeld + â€žKI-Vorschlag annehmen/verwerfen"-Button.**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Erfahrung â€” Frontend Praktikant @ Mediahaus    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Original (editierbar):                          â”‚
â”‚ [ Habe an Webseiten mitgearbeitet, JS-Frameworks ] â”‚
â”‚                                                  â”‚
â”‚ âœ¦ KI-Vorschlag:                                 â”‚
â”‚ Migration der Marketing-Site auf Next.js 14,    â”‚
â”‚ Lighthouse 62 â†’ 96.                             â”‚
â”‚   [âœ“ Ãœbernehmen]  [âœ— Verwerfen]  [âœ Anpassen]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 11. Versand-Funktion (Variante b + c kombiniert)

1. **â€žAn mich senden"-Button:** PDFs gehen per Resend an die User-E-Mail (zum Weiterleiten)
2. **â€žIn E-Mail-Programm Ã¶ffnen"-Button:** `mailto:`-Link mit:
   - EmpfÃ¤nger: vom User einzugeben
   - Betreff: vorgeneriert ("Bewerbung als {role}")
   - Body: Anschreiben-Vorschau
   - Anhang: Hinweis "PDFs aus AnhÃ¤ngen anhÃ¤ngen" (mailto unterstÃ¼tzt keine Attachments)

â†’ Kein SMTP-Relay nÃ¶tig, kein Spam-Risiko, datenschutzfreundlich.

---

## 12. Dashboard-Funktionen V1

- âœ… Liste aller Bewerbungen mit Match-Score und Status
- âœ… Status-Tracking (gesendet/Antwort/Interview/Absage/Angebot)
- âœ… Master-CV-Verwaltung (mehrere CVs pro User, z. B. â€žTech DE", â€žTech EN")
- âœ… Mehrsprachige CV-Versionen (DE + EN)
- âœ… Versand: An-mich + Mailto
- âœ… Follow-up-Vorlagen (3 Templates: Erinnerung, Status-Anfrage, Dank)
- âœ… LinkedIn-Profil-Optimierung (User pasted Profil-Text, ohne API)

**Nicht in V1:** LinkedIn-API, Indeed-API, Xing-API, Browser-Extension.

---

## 13. WCAG 2.2 AAA â€” was das konkret heiÃŸt

| Anforderung | Umsetzung |
|---|---|
| Kontrast 7:1 fÃ¼r Text | Token `--ink: oklch(20% â€¦)` auf `--bg: oklch(98.6% â€¦)` ergibt 17:1 âœ“ |
| Kontrast 4.5:1 fÃ¼r Large-Text | gegeben |
| Tastatur-Navigation komplett | `tabindex`, sichtbare Focus-Rings (3px Outline) |
| Screen-Reader-Support | `aria-label`, `aria-live` fÃ¼r Pipeline-Progress, `<output>`-Tags |
| Bewegung pausierbar | `prefers-reduced-motion` respektieren, alle Animationen unter 5s |
| Keine Text-Bilder | Alles via SVG-Icons + echtem Text |
| Sprache markiert | `lang="de"` / `lang="en"` auf Root |
| Form-Labels | jedes Input mit `<label>` + `aria-describedby` fÃ¼r Errors |
| Skip-Links | â€žZum Hauptinhalt springen" am Seiten-Anfang |
| Audit | axe-core in jeder E2E-Run; manueller VoiceOver/NVDA-Test vor Launch |

**Test-Stack:** axe-core + Playwright + Lighthouse a11y-Audit (Ziel: 100/100).

---

## 14. DSGVO & Datenschutz

| Anforderung | Umsetzung |
|---|---|
| Datenresidenz | Hetzner Falkenstein (DE), Postgres lokal, kein S3 |
| Originaldateien | werden **nicht** persistiert (RAM-only) |
| Auto-Purge | 30 Tage nach letztem Login â†’ Soft-Delete; nach weiteren 30 Tagen Hard-Delete |
| Datenexport | `/gdpr/export` â†’ ZIP mit JSON aller Tabellen + alle PDFs frisch gerendert |
| Recht auf LÃ¶schung | sofortiger Soft-Delete via `DELETE /me`, Cron rÃ¤umt nach 30d |
| AVV | mit Resend, Paddle, Groq, Anthropic â€” alle abgeschlossen vorab |
| Cookies | nur essenzielle (Session). Plausible cookielos. Kein Cookie-Banner nÃ¶tig. |
| DatenschutzerklÃ¤rung | nach DSK-Mustertext, anwaltlich geprÃ¼ft (~1 500 â‚¬) |
| Impressum | TMG/MStV-konform |

---

## 15. Payments (Paddle)

- **Produkte:**
  - `pri_pay_per_app` â€” 4,90 â‚¬ (Einmal)
  - `pri_pro_monthly` â€” 14 â‚¬/mo
  - `pri_pro_yearly` â€” 130 â‚¬/Jahr (~22 % Rabatt)
- Paddle Ã¼bernimmt **alle Steuern** (MwSt. EU + USt-Reverse-Charge), Rechnungsstellung
- Money-Back-Garantie: Match-Score < 80 % â†’ automatischer Refund-Webhook
- **Webhooks:** `transaction.completed`, `subscription.activated`, `subscription.canceled`

---

## 16. Monitoring

- **Sentry self-hosted** auf gleichem Hetzner-Server (Docker) â€” Error-Tracking FE+BE
- **Plausible self-hosted** â€” cookielos, EU
- **Better Stack Free Tier** â€” Uptime-Pings (5min)
- **AI-Quality-Dashboard** â€” Daily Cron: Schema-Failures, Halluzinations-Flags, Score-Drift

---

## 17. Tests

- **Unit:** Vitest (FE), Jest (BE) â€” Ziel â‰¥ 70 % Coverage in `services/`
- **Component:** Angular Testing Library
- **E2E:** Playwright â€” Try, Pay, Login, Editor, Export
- **a11y:** axe-core in jedem E2E-Run, Lighthouse a11y 100/100 Pflicht
- **AI-Eval:** 50 Fixture-CV+Job-PÃ¤rchen, nightly Run, Drift-Alarm bei > 5 %

---

## 18. Roadmap (3,5 Monate Solo)

| Woche | Inhalt | Deliverable |
|---|---|---|
| **0** | Hetzner-Setup, Domain, Caddy, Postgres, Repo-Setup, CI (GitHub Actions) | Server live, â€žhello world" auf Domain |
| **1** | Angular-Skeleton + Tailwind + Tokens + Landing-Page-Port (1:1) | Landing live, SEO-fÃ¤hig |
| **2** | Auth-Modul (BE + FE): Register/Login/Verify, JWT, Cookie-Handling | Login funktioniert |
| **3** | CV-Upload + Pipeline-Stub (Mock-Antworten) + Try-Flow | End-to-End mit Mocks |
| **4** | AI-Pipeline echt: Groq, alle 4 Calls + Halluzinations-Guards | Echte Optimierung lÃ¤uft |
| **5** | Editor mit Diff-View + Inline-Edit, â€žÃœbernehmen/Verwerfen" | Editor benutzbar |
| **6** | PDF-Renderer + 3 Templates (Modern/Clean/Editorial) | PDF-Download funktioniert |
| **7** | Wizard (5-Felder) + Job-Eingabe (URL+Screenshot+PDF) | Alle Eingabemodi |
| **8** | Dashboard + Master-CVs + Status-Tracking + Mehrsprachigkeit | App-Komplettheit |
| **9** | Paddle-Integration + Webhook + Money-Back-Logik | Bezahlung funktioniert |
| **10** | DSGVO-Export + Auto-Purge-Cron + DatenschutzerklÃ¤rung-Anwalt | Rechtlich sauber |
| **11** | a11y-Audit (axe + manuelles VoiceOver), WCAG-AAA-Fixes | a11y 100/100 |
| **12** | Mail-Funktion (An-mich + Mailto), Follow-up-Vorlagen, LinkedIn-Optimierung | Feature-Complete |
| **13** | Pen-Test light, Sentry/Plausible scharf, Beta-Test mit 20 Leuten | Beta-Launch |
| **14** | Bug-Fix, Polish, Marketing-Setup | **Public Launch** |

**Bei 25â€“30 h/Woche realistisch.** Bei 40 h/Woche: 11 Wochen.

---

## 19. Kosten Solo-Pilot (erste 6 Monate)

| Posten | Pro Monat |
|---|---|
| IONOS VPS XL 8 + Backups | 35 â‚¬ |
| Domain + SSL | 1 â‚¬ |
| Resend (50k Mails free) | 0 â‚¬ |
| Plausible self-hosted | 0 â‚¬ |
| Sentry self-hosted | 0 â‚¬ |
| Groq API budget | 0 â‚¬ |
| Better Stack Free | 0 â‚¬ |
| **Pro Monat** | **~60 â‚¬** |
| **Anwaltliche DSGVO-PrÃ¼fung** (einmalig) | 1 500 â‚¬ |
| **Pen-Test light** (einmalig) | 1 500 â‚¬ |

**Gesamt erste 6 Monate:** ~3 400 â‚¬. Bei 30 zahlenden Pro-Usern (420 â‚¬ MRR) bereits profitabel.

---

## 20. Offene Punkte zum spÃ¤teren KlÃ¤ren

1. **Rechtsform** â€” Einzelunternehmen fÃ¼r V1 ausreichend; GmbH erst ab >50k Umsatz oder Investoren. **Anwalt fragen vor Launch.**
2. **Domain** â€” noch zu wÃ¤hlen (VorschlÃ¤ge: `lebenslauf-agent.de`, `bewerbung-passt.de`, `cvgen.de`).
3. **Marketing-Plan** â€” nicht Teil dieser Spec; LinkedIn-Posts + IndieHackers-Launch + Reddit-Subs sind Solo-tauglich.
4. **Backup-Strategie** â€” Hetzner Backup-Volume + tÃ¤glicher pg_dump nach R2 separat (nur SQL-Dump, keine User-Files).
5. **LinkedIn-/Indeed-/Xing-API** â€” V2.0-Feature, sobald 100 zahlende User erreicht.

---

## 21. EndgÃ¼ltige Architektur-Entscheidungen (lock!)

| Entscheidung | Wert |
|---|---|
| Frontend | Angular 21 Standalone, klassisches Repo |
| Backend | NestJS (Node 20) |
| DB | Postgres 16 self-hosted Hetzner |
| Auth | self-built JWT + Argon2id |
| Storage | **kein** File-Storage |
| AI Pilot | **Groq API** |
| AI Prod | Groq primary + Claude fallback |
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

> **NÃ¤chster Schritt:** Server provisionieren (IONOS-Account + Domain), Repo erstellen, Phase 0 starten.

---

## 22. Authentifizierung & Autorisierung (Detail)

### 22.1 Authentifizierung â€” Wer bist du?

**Endpunkte:**

| Route | Funktion |
|---|---|
| `POST /auth/register` | Email + Passwort, Argon2id (memCost 65536, time 3, parallelism 4), Verify-Mail (24h Token) |
| `GET /auth/verify?token=` | setzt `email_verified_at`, redirect /login |
| `POST /auth/login` | Rate 10/15min/IP+Email, Lockout nach 5 Fehlversuchen (15min), HIBP-k-Anonymity-Check |
| `POST /auth/refresh` | Rotation, Reuse-Detection â†’ revoke ALL Sessions |
| `POST /auth/logout` | Refresh-Token blacklisten (Redis), Cookie clearen |
| `POST /auth/forgot-password` | Generic-Response (kein Hint ob Mail existiert), 1h Token |
| `POST /auth/reset-password` | Token + neues Passwort |
| `POST /auth/2fa/enable` | TOTP, QR + 10 Backup-Codes (optional, Pro-User empfohlen) |
| `POST /auth/2fa/verify` | bei Login zweiter Schritt |

**Token-Strategie:**
- **Access-Token:** JWT, **EdDSA (Ed25519)**, 15 min Lifetime, in Memory (kein localStorage!)
- **Refresh-Token:** Opaque random (32 Bytes), 30d, **HttpOnly + Secure + SameSite=Lax** Cookie
- **Rotation:** jeder Refresh-Use â†’ neuer Token, alter blacklisted in Redis
- **Reuse-Detection:** alter Token nochmal verwendet â†’ Token-Theft erkannt â†’ ALLE Sessions des Users revoken + Mail an User
- **Concurrent Sessions:** max 5 aktive Refresh-Tokens, Ã¤lteste rausschmeiÃŸen

**JWT-Payload:**
```json
{ "sub": "uuid", "plan": "pro", "ev": true, "tfa": false,
  "iat": 1715169600, "exp": 1715170500, "jti": "uuid" }
```

**Passwort-Policy (NIST 800-63B):**
- min 12 Zeichen, **kein** KomplexitÃ¤ts-Zwang
- HIBP-Pwned-Check via k-Anonymity
- `autocomplete="new-password"` fÃ¼r Passwort-Manager

### 22.2 Autorisierung â€” Was darfst du?

**Drei Schichten:**

```
1. Route-Guard       â†’ eingeloggt?
2. Plan-Gate         â†’ richtiger Plan?
3. Resource-Owner    â†’ gehÃ¶rt dir die Ressource?
```

**Rollen & PlÃ¤ne:**
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

| MaÃŸnahme | Umsetzung |
|---|---|
| CSRF | Double-Submit-Cookie + CSRF-Header fÃ¼r mutating Requests |
| XSS | strict CSP, kein `innerHTML`, AI-Output via `DomSanitizer` |
| Clickjacking | `X-Frame-Options: DENY` |
| Session-Timeout | 30 min InaktivitÃ¤t â†’ silent Refresh oder Logout |
| Device-Tracking | UA + IP-Hash in `sessions`-Tabelle, â€žAktive GerÃ¤te" im Profil |
| Suspicious Login | neue IP-Region â†’ Mail-Notification |
| Audit-Log | jeder Auth-Event in `audit_log` |
| 2FA fÃ¼r Admin | **Pflicht** |
| 2FA fÃ¼r Pro-User | optional, sehr empfohlen |

---

## 23. Sicherheit (Ã¼ber Auth hinaus)

| Bereich | MaÃŸnahme |
|---|---|
| HTTP-Header | Helmet.js â€” strict CSP, HSTS, Referrer-Policy `no-referrer`, X-Content-Type-Options `nosniff` |
| File-Upload | Magic-Byte-Check (PDF `%PDF-`, DOCX `PK\x03\x04`), max 10 MB, MIME-Sniff-Schutz |
| Prompt-Injection | System-Prompt + Delimiter `<<<JOB_AD>>>...<<<END>>>`, User-Input getrennt |
| AI-Output-Sanitization | `sanitize-html` vor PDF-Render und Editor-Display |
| Dependency-Scanning | GitHub Dependabot + Snyk Free, wÃ¶chentlich |
| `security.txt` | unter `/.well-known/security.txt` mit Kontakt |
| AI-Cost-Limit | Free 1 Bewerbung/24h, Pro 10/24h (Abuse-Schutz) |
| Pen-Test | extern, light-version, vor Public-Launch (~1 500 â‚¬) |
| Bug-Bounty | Hall-of-Fame-Liste auf `/security`, kein Geld V1 |

---

## 24. Cookies & TTDSG

**TTDSG Â§ 25 Abs. 2 Nr. 2 â€” Ausnahme â€žunbedingt erforderlich":**

| Cookie | Zweck | Consent? |
|---|---|---|
| `__Host-session` (Refresh-Token) | Login | nein, technisch erforderlich |
| `__Host-csrf` | CSRF-Schutz | nein, technisch erforderlich |
| Plausible | Analytics | **cookielos** â†’ nein |
| **Crisp Chat** | Customer-Support | **JA, Consent erforderlich** |

â†’ **Cookie-Banner zwingend, sobald Crisp aktiv ist.**

**Banner-Architektur:**
- Eigenbau, kein Cookiebot/Usercentrics (DSGVO-konform aber Lock-in)
- 3 Buttons: â€žAlle akzeptieren" / â€žNur notwendige" / â€žEinstellungen"
- Default: **alle nicht-notwendigen Cookies aus** (Privacy-by-Default Art. 25)
- State in `localStorage` (`consent_v1`)
- Crisp-Skript nur laden wenn `consent.support === true`
- jÃ¤hrliches Re-Consent (alter Banner-Code wird ungÃ¼ltig)
- jederzeit widerrufbar via Footer-Link â€žCookie-Einstellungen"

**Implementierung:** Angular Service `ConsentService` mit Signal `consent()`, alle Drittanbieter-Skripte laden lazy via `effect()`.

---

## 25. Datenschutz fÃ¼r Art.-9-Daten (Schutzkonzept)

### 25.1 Warum besonders heikel
CVs enthalten oft besondere Kategorien nach Art. 9 DSGVO: Bewerbungsfoto (ethnische Herkunft), Gesundheit (Schwerbehinderung, LÃ¼cken), Religion (kirchliche AG), Gewerkschaft, politische Einstellung, sex. Orientierung (Vereine).

### 25.2 Verpflichtende MaÃŸnahmen

| MaÃŸnahme | Umsetzung |
|---|---|
| **DSFA** (Art. 35) | Pflicht â€” Trigger: AI-Profiling + Art-9 + neue Tech. Vorlage BfDI, vor Launch dokumentiert |
| **VVT** (Art. 30) | Tabelle aller Verarbeitungen, Vorlage GDD, einmalig ~3h |
| **AusdrÃ¼ckliche Einwilligung** (Art. 9 Abs. 2 lit. a) | separate Checkbox vor Upload, kein Pre-Tick, jederzeit widerrufbar |
| **Anonymisierungs-Toggle** im Editor | Foto entfernen, Religion/Gewerkschaft/Politik-Felder maskieren â€” **default: Foto behalten, sensible Felder ausgeblendet** |
| **Datenminimierung-Hinweis** vor Upload | â€žFoto, Familienstand, Religion sind in DE optional" |
| **Original-Datei nie persistiert** | RAM-only, max 60s |
| **AI-Prompts/Responses LÃ¶schfrist** | 30 Tage (war lÃ¤nger, gekÃ¼rzt) |
| **Drittland-Verarbeitung** | anbieterabhaengig: Groq/Anthropic nur nach AVV- und Transferpruefung fuer Art-9 |
| **AVV** | mit Groq, Anthropic, Resend, Paddle, IONOS â€” alle vor Go-Live |
| **DPO extern** | empfohlen, ~150 â‚¬/mo (Art. 9 + AI = best practice) |
| **DatenschutzerklÃ¤rung** | anwaltlich geprÃ¼ft (~1 500 â‚¬), nicht Template |
| **Datenpannen-Meldeprozess** | Art. 33: 72h-Frist BfDI, Template + Playbook vorbereitet |

### 25.3 Foto-Behandlung im Editor

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Foto im optimierten Lebenslauf            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â—‰ Behalten                                â”‚
â”‚  â—‹ Anonymisieren (entfernen)              â”‚
â”‚                                            â”‚
â”‚ â„¹ Anonyme Bewerbungen sind im Ã¶ffentlichen â”‚
â”‚   Dienst Deutschland Standard und kÃ¶nnen  â”‚
â”‚   Bias reduzieren.                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 25.4 Bias-Testing
- 10 CV-Varianten (Name, Foto, Adresse) mit gleicher Substanz
- Match-Score-Variation messen, Drift > 5 % â†’ Alert
- nightly via GitHub Actions

---

## 26. Operations, CI/CD & Recht (Restpunkte)

### 26.1 CI/CD
- **GitHub Actions:** Lint â†’ Test â†’ axe a11y â†’ Build â†’ Deploy via SSH (rsync + `docker compose up`)
- **Staging:** 2. IONOS-VPS klein (~10 â‚¬/mo), getrennte DB, Test-Paddle-Sandbox
- **Migrations:** Prisma Migrate, jede Migration im PR reviewbar
- **Secrets:** Doppler (Free Tier) ODER `.env.production` mit `chmod 600`

### 26.2 Backup & Disaster Recovery
- pg_dump tÃ¤glich â†’ IONOS Object Storage, gpg-verschlÃ¼sselt, 30d Retention
- monatlicher Restore-Test (dokumentiert!)
- RTO 4h, RPO 24h
- Backup-Bucket in **anderer Region** als Hauptserver (Karlsruhe â†” Berlin)

### 26.3 Monitoring & Logging
- Sentry self-hosted (Errors)
- Plausible self-hosted (Analytics, cookielos)
- Better Stack Free (Uptime, 60s Pings)
- pino strukturierte Logs â†’ Datei-Rotation â†’ 30d â†’ gpg-Archiv (Compliance)
- `/health`-Endpoint: DB-Ping, Redis, AI-provider ping
- AI-Quality-Dashboard: Schema-Failures, Halluzinations-Flags, Cost/User

### 26.4 Email-Infrastruktur
- Resend EU-Region
- SPF, DKIM, DMARC Records fÃ¼r Domain
- Templates via React-Email: Welcome, Verify, Reset, Receipt, Bewerbung-Fertig, Sicherheits-Alerts
- Domain-Subdomains: `app.`, `api.`, `mail.`, `status.`

### 26.5 Customer Support
- **Crisp** (Free 1-Operator, EU-Server) â†’ Cookie-Banner-Pflicht
- `support@domain.de` Mailbox
- FAQ-Seite mit `<details>` strukturiert
- NPS-Survey nach Export

### 26.6 Recht (VollstÃ¤ndigkeitscheck)

| Punkt | Status / To-do |
|---|---|
| AGB | Anwalt, ~500 â‚¬ |
| DatenschutzerklÃ¤rung | Anwalt, ~1 500 â‚¬ |
| Impressum | TMG/MStV-konform |
| Widerrufsbelehrung B2C 14d | digitale Inhalte: ErlÃ¶schen nach Lieferung **nur** mit ausdr. Zustimmung |
| VSBG-Hinweis | â€žWir nehmen nicht teil" |
| BFSG (seit 28.06.2025) | mit WCAG 2.2 AAA Ã¼bererfÃ¼llt |
| Steuer | Â§19 UStG bis 22 000 â‚¬, dann Regelbesteuerung |
| Rechtsform | Einzelunternehmen V1, GmbH ab 50 kâ‚¬/Investoren |
| AGG-Bias-Test | siehe Â§ 25.4 |

### 26.7 Was nicht vergessen wurde
- Domain-Wahl + WHOIS-Privacy
- Onboarding-Tour (3 Tooltips beim ersten Login)
- Empty-States, Loading-Skeletons (nicht Spinner)
- Error-Pages 404/500 deutsche TonalitÃ¤t
- SEO-Basics: sitemap.xml, robots.txt, OG-Tags, structured data
- Discount-Codes: `STUDENT20`, `LAUNCH10`
- Beta-Tester: 20 aus Studenten-FB-Gruppen, Reddit r/de_EDV, Uni Career-Centers

---

## 27. Roadmap-Anpassung (14â€“16 Wochen statt 13â€“14)

ZusÃ¤tzliche AufwÃ¤nde durch Art-9-Schutz, AAA-a11y, Cookie-Banner, Crisp-Integration, Bias-Testing, DSFA:

| Woche | ZusÃ¤tzlicher Inhalt |
|---|---|
| 0 | + Cookie-Banner-Komponente, Consent-Service |
| 4 | + Prompt-Injection-Defense, AI-Output-Sanitizer |
| 10 | + DSFA-Dokument schreiben, VVT befÃ¼llen |
| 11 | + Bias-Testing-Suite, Anonymisierungs-Toggle |
| 13 | + Crisp-Integration nach Consent, AGB+DSE-Anwaltsreview |
| 14â€“15 | Puffer, Beta-Feedback |
| 16 | **Public Launch** |

---

> **Status:** Spec V1.0 final, alle Architektur-Entscheidungen gelockt.
