# Verzeichnis von Verarbeitungstaetigkeiten (VVT) - Arbeitsfassung

Status: fachlich vorbereitet, vor Public-Launch final durch Verantwortlichen zu pruefen.

## VT-1 Nutzerkonto und Authentifizierung

| Feld | Inhalt |
|---|---|
| Zweck | Account-Verwaltung, Registrierung, Login, Session-Sicherheit |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO |
| Daten | E-Mail, Name, Passwort-Hash, Plan, Session-Hash, IP-Hash, User-Agent, 2FA-Status |
| Empfaenger | Resend fuer E-Mail-Versand, Hosting/DB-Anbieter |
| Speicherfrist | Bis Account-Loeschung; Soft-Delete und Hard-Purge nach 30 Tagen |
| TOM | Argon2id, JWT, Refresh-Token-Hashing, TOTP, Rate-Limits |

## VT-2 CV-Upload und CV-Analyse

| Feld | Inhalt |
|---|---|
| Zweck | Strukturierung und Optimierung von Lebenslaufdaten |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b; Art. 9 Abs. 2 lit. a bei besonderen Kategorien |
| Daten | CV-Inhalte, Dateiname, Hash, strukturierte CV-Daten |
| Empfaenger | Konfigurierter AI-Provider, Hosting/DB-Anbieter |
| Speicherfrist | Originaldateien nicht dauerhaft; strukturierte Daten bis Account-Loeschung |
| TOM | RAM-only Upload, Dateityppruefung, Zod-Validierung, Resource-Owner-Checks |

## VT-3 Stellenanzeigen-Verarbeitung

| Feld | Inhalt |
|---|---|
| Zweck | Extraktion von Rollenanforderungen und Match-Berechnung |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO |
| Daten | Stellenanzeigen-Text, Hash, strukturierte Anforderungen |
| Empfaenger | Konfigurierter AI-Provider |
| Speicherfrist | Bis Account-Loeschung |
| TOM | Prompt-Delimiter, Schema-Validierung, User-Scoping |

## VT-4 Bewerbungs-Optimierung und PDF-Export

| Feld | Inhalt |
|---|---|
| Zweck | Erstellung optimierter CVs, Anschreiben, Match-Reports und PDFs |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b; Art. 9 Abs. 2 lit. a soweit CV-Daten betroffen |
| Daten | Optimierter CV, Anschreiben, Match-Score, Match-Report, Bewerbungsstatus |
| Empfaenger | Konfigurierter AI-Provider, Resend bei E-Mail-to-self |
| Speicherfrist | Bewerbungsdaten bis Account-Loeschung; generierte PDFs RAM-only |
| TOM | Server-owned Score/Report, in-memory PDF-Render, Session/Auth Guards |

## VT-5 Zahlungsabwicklung

| Feld | Inhalt |
|---|---|
| Zweck | Abrechnung und Plan-Status |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO |
| Daten | Paddle-Kundendaten, Plan-Status, Webhook-Events |
| Empfaenger | Paddle als Merchant of Record |
| Speicherfrist | Steuer- und handelsrechtliche Fristen beim Zahlungsanbieter; Planstatus im System bis Account-Loeschung |
| TOM | Signierte Webhooks, keine direkte Kartenverarbeitung |

## VT-6 Support und Kommunikation

| Feld | Inhalt |
|---|---|
| Zweck | Support, Sicherheitsmeldungen, Verifikation |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b/f DSGVO |
| Daten | E-Mail, Support-Inhalte, Sicherheitsereignisse |
| Empfaenger | Resend; Crisp nur nach Aktivierung/Cookie-Consent |
| Speicherfrist | Nach Support-/Vertragszweck, final vor Launch festzulegen |
| TOM | Minimaldaten, AVV, Zugriffsbeschraenkung |
