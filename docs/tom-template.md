# Technische und organisatorische Maßnahmen (TOM)

> Anhang zu jedem AVV. Nach Art. 32 DSGVO.

## 1. Vertraulichkeit

### 1.1 Zutrittskontrolle
- IONOS-Rechenzentren BSI C5 Typ 2 zertifiziert
- physischer Zugang nur durch IONOS-Personal

### 1.2 Zugangskontrolle
- SSH nur via Public Key (kein Passwort)
- 2FA für Admin-Accounts (Pflicht)
- Login-Versuche begrenzt (5 Fails → 15 min Lockout)

### 1.3 Zugriffskontrolle
- Rollen-System (USER, ADMIN)
- Plan-basierte Berechtigungen (FREE, PAY, PRO)
- Resource-Owner-Checks (jede Ressource an User-ID gebunden)
- Audit-Log aller Zugriffe

### 1.4 Trennungsgebot
- Mandantenfähig: Daten pro User-ID isoliert
- Test-/Staging-/Prod-Datenbanken getrennt

### 1.5 Pseudonymisierung
- IP-Adressen nur als SHA-256-Hash gespeichert
- User-IDs als UUID v4 (nicht ableitbar)

## 2. Integrität

### 2.1 Weitergabekontrolle
- TLS 1.3 in Transit
- AVV mit allen Subprozessoren

### 2.2 Eingabekontrolle
- Audit-Log (`audit_log`-Tabelle): jeder mutierende Zugriff geloggt
- Versionierung der AI-Prompts und -Modelle

## 3. Verfügbarkeit

### 3.1 Verfügbarkeitskontrolle
- Tägliche pg_dump-Backups, gpg-verschlüsselt, Object Storage
- Monatliche Restore-Tests
- RTO 4h, RPO 24h
- Better Stack Uptime-Pings 60s

### 3.2 Wiederherstellbarkeit
- 30 Tage Backup-Retention
- DR-Plan dokumentiert

## 4. Belastbarkeit

- Rate-Limiting per Redis (NestJS Throttler)
- AI-Cost-Limits pro User
- Helmet.js + strict CSP
- Dependency-Scanning wöchentlich

## 5. Verfahren regelmäßiger Überprüfung

- Pen-Test light vor Public-Launch
- Jährliches DSFA-Review
- Quartalsweise TOM-Review

## 6. Auftragskontrolle

- AVV-Sammlung in `docs/avv/` (Groq, Anthropic, Resend, Paddle, IONOS, Crisp)
- Kein Subunternehmer ohne dokumentierten AVV
