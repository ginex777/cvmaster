# Verzeichnis von Verarbeitungstätigkeiten (VVT)

> Pflicht nach Art. 30 DSGVO bei Art-9-Verarbeitung.

## VT-1 — Nutzerkonten & Authentifizierung

| Feld | Wert |
|---|---|
| Zweck | Account-Verwaltung, Login |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b |
| Datenkategorien | Email, Name, Passwort-Hash, Login-Logs |
| Empfänger | Resend (Mail-Versand) |
| Speicherdauer | bis Account-Löschung + 30d |
| TOMs | Argon2id, EdDSA-JWT, Rate-Limiting |

## VT-2 — Lebenslauf-Analyse

| Feld | Wert |
|---|---|
| Zweck | CV-Strukturierung |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b + Art. 9 Abs. 2 lit. a |
| Datenkategorien | Vollständige CV-Inhalte inkl. Art-9 |
| Empfänger | Groq, Anthropic, Resend, Paddle, Hosting- und Supportanbieter nach AVV |
| Speicherdauer | parsed_json: bis Löschung; AI-Logs: 30d |
| TOMs | EU-only Provider, AVV, Halluzinations-Guards |

## VT-3 — Stellenanzeigen-Verarbeitung
[...]

## VT-4 — Bewerbungs-Optimierung
[...]

## VT-5 — Zahlungsabwicklung

| Feld | Wert |
|---|---|
| Zweck | Bezahlung |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b |
| Datenkategorien | Email, Name, Adresse, Bezahldaten (nur bei Paddle) |
| Empfänger | Paddle (IE) als Merchant-of-Record |
| Speicherdauer | Steuer 10 Jahre (§ 147 AO) |
| TOMs | AVV mit Paddle, kein Direkt-Karten-Handling |

## VT-6 — Customer Support (Crisp)
[...]

## VT-7 — Analytics (Plausible cookielos)
[...]
