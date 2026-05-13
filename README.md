# Lebenslauf-Agent — Monorepo

Solo-Dev-Setup nach SPEC.md V1.0.

## Struktur

```
lebenslauf-agent/
├─ frontend/          # Angular 21 Standalone, Zoneless, Signal Forms
├─ backend/           # NestJS (Node 20)
├─ infra/             # docker-compose, Caddy, Deploy-Skripte
├─ docs/              # SPEC, DSFA, VVT, TOM
└─ .github/workflows/ # CI/CD
```

## Schnellstart (lokal)

```bash
# 1. Abhängigkeiten
cd frontend && pnpm install
cd ../backend && pnpm install

# 2. Lokale Datenbank + Redis starten
cd ../infra && docker compose up -d postgres redis

# 3. Backend starten (Port 3000)
cd ../backend && pnpm start:dev

# 4. Frontend starten (Port 4200)
cd ../frontend && pnpm start
```

## Production-Deploy (IONOS Cloud)

1. **VPS provisionieren:** IONOS VPS XL 8 (Berlin oder Karlsruhe), Ubuntu 24.04
2. **DNS einrichten:** A-Record auf VPS-IP, MX/SPF/DKIM für Domain
3. **Server-Setup:**
   ```bash
   ssh root@vps
   apt update && apt install -y docker.io docker-compose-plugin
   git clone <repo> /opt/lba && cd /opt/lba/infra
   cp .env.example .env.production && vi .env.production
   docker compose --env-file .env.production up -d
   ```
4. **Caddy** holt Let's-Encrypt-SSL automatisch beim ersten Start.

## Tech-Stack-Lock (siehe SPEC § 21)

| Layer | Tech |
|---|---|
| FE | Angular 21 Standalone, Zoneless, Tailwind, GSAP, axe-core |
| BE | NestJS, Prisma, BullMQ, Argon2id, EdDSA-JWT |
| DB | Postgres 16 |
| Cache | Redis 7 |
| Queue | BullMQ |
| AI | Groq primary with Claude fallback |
| Mail | Resend (EU-Region) |
| Pay | Paddle |
| Hosting | IONOS Cloud (BSI C5) |
| Monitoring | Sentry self-hosted, Plausible self-hosted, Better Stack Free |
| Support | Crisp (nach Cookie-Consent) |

## Compliance-Pflicht-Dokumente vor Public-Launch

- [ ] DSFA (`docs/dsfa.md`) — Pflicht wegen Art-9 + AI
- [ ] VVT (`docs/vvt.md`) — Pflicht ab Art-9-Verarbeitung
- [ ] TOM (`docs/tom.md`) — Anhang zu jedem AVV
- [ ] AGB + Datenschutzerklärung (anwaltlich)
- [ ] AVV-Sammlung: Groq, Anthropic, Resend, Paddle, IONOS, Crisp

## Roadmap-Tracking

Siehe `SPEC.md` § 27 — 14–16 Wochen Solo, Phasen 0–14.
