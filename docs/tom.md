# Technische und organisatorische Massnahmen (TOM) - Arbeitsfassung

Status: technische Arbeitsfassung, vor Public-Launch gegen reale Infrastruktur und AVVs zu pruefen.

## 1. Vertraulichkeit

- Zugriff nur fuer berechtigte Betreiber/Admins.
- SSH-Zugriff auf Server nur per Public Key.
- Passwortspeicherung mit Argon2id.
- JWT Access Tokens kurzlebig; Refresh Tokens werden nur gehasht gespeichert.
- TOTP-Unterstuetzung fuer Nutzerkonten.
- Resource-Owner-Checks fuer nutzerbezogene Ressourcen.
- IP-Adressen werden gehasht gespeichert.

## 2. Integritaet

- Eingaben werden mit Zod validiert.
- LLM-Ausgaben werden mit Zod-Schemas validiert.
- Bewerbungs-Score und Match-Report sind server-owned und nicht ueber den allgemeinen Client-PATCH schreibbar.
- Paddle-Webhooks werden signiert geprueft.
- PDF-Erzeugung erfolgt aus serverseitigen Templates.
- Kritische Status- und Auth-Flows sind getestet.

## 3. Verfuegbarkeit

- Docker Compose trennt Caddy, Frontend, API, Worker, Postgres und Redis.
- Health-Endpunkt prueft Datenbank und Redis unter `/api/health`.
- Queue-Worker laeuft getrennt von der API.
- AI-Fehler werden fuer Nutzer sichtbar und koennen erneut gestartet werden.
- Backup- und Restore-Prozess muss vor Public-Launch final gegen die Zielinfrastruktur getestet werden.

## 4. Belastbarkeit

- Rate-Limiting auf Auth, Trial, Job-Parse und Application-Create.
- CSP ueber Helmet und Caddy.
- Frontend- und Backend-Builds sind in der Audit-Baseline gruen.
- Public a11y smoke fuer Landing, Pricing und Trial.

## 5. Datenschutz durch Technikgestaltung

- Originaluploads werden RAM-only verarbeitet und nicht dauerhaft gespeichert.
- Generierte PDFs werden fuer Download/E-Mail in memory erzeugt und nicht auf Disk persistiert.
- Account-Loeschung setzt Soft-Delete, widerruft Sessions und fuehrt Hard-Purge nach 30 Tagen aus.
- AI-Job-Daten werden nach 30 Tagen gepurgt; vollstaendige AI-Job-Audit-Erfassung ist separat im Audit offen.

## 6. Auftragsverarbeiter und Nachweise

Vor Public-Launch muessen AVV/Nachweise abgelegt werden fuer:

- AI-Provider, tatsaechlich konfiguriert
- Resend oder tatsaechlicher Mailprovider
- Paddle
- Hosting/IONOS oder tatsaechlicher Infrastrukturprovider
- Crisp oder tatsaechlicher Supportprovider
- Monitoring/Analytics-Provider, falls aktiviert

Nachweise gehoeren nach `docs/avv/` und duerfen keine Secrets enthalten.
