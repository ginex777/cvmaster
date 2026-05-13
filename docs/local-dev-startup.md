# Local Development â€” Startup Guide

## Prerequisites

- Docker Desktop running
- A Groq API key

---

## One-time setup

### 1. Disable the Windows PostgreSQL service (Windows only)

If you have PostgreSQL installed locally on Windows it will occupy port 5432 and block Docker. Disable it so it never starts automatically:

```powershell
Set-Service -Name postgresql-x64-18 -StartupType Disabled
Stop-Service -Name postgresql-x64-18
```

If the service name differs on your machine: `Get-Service | Where-Object {$_.Name -like '*postgres*'}`

### 2. Create the infra env file

Create `infra/.env` (already gitignored):

```env
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-key-here
```

All other values have safe defaults in `docker-compose.yml` for local dev.

---

## Option A â€” Docker (recommended, single command)

From the `infra` directory:

```powershell
cd infra
docker compose up --build
```

- First run takes ~5 minutes to build the images
- Subsequent runs without code changes: `docker compose up` (uses cached images, starts in seconds)
- After code changes: `docker compose up --build`
- App is at **http://localhost**
- All logs stream in the same terminal. To find the email verification link:
  ```powershell
  docker compose logs api | findstr verify
  ```

### Shutdown

```powershell
# Ctrl+C to stop, then:
docker compose down
```

Wipe the database for a completely fresh start:

```powershell
docker compose down -v   # WARNING: deletes all data
docker compose up --build
```

---

## Option B â€” Native (4 terminals, hot reload)

Use this when actively developing and need instant code reloading.

### Additional prerequisites

- Node 20+ installed

### One-time setup (native only)

Create `backend/.env` (already gitignored):

```env
DATABASE_URL=postgresql://lba:local-postgres-password@localhost:5432/lba
REDIS_URL=redis://:local-redis-password@localhost:6379
JWT_SECRET=replace-with-any-random-string
IP_SALT=replace-with-any-random-string
APP_URL=http://localhost:4200
NODE_ENV=development
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-key-here
MAIL_DOMAIN=localhost
```

> In dev mode, no `RESEND_API_KEY` is needed. The email verification link is printed to the backend console instead.

### Terminal 1 â€” Infrastructure

```powershell
cd infra
docker compose up -d postgres redis
```

Wait until both show `Up (healthy)`:

```powershell
docker compose ps
```

### Terminal 2 â€” Backend API

```powershell
cd backend
npm run prisma:deploy   # only needed once, or after schema changes
npm run start:dev
```

Wait for: `Application is running on: http://[::1]:3000`

### Terminal 3 â€” AI Worker

```powershell
cd backend
npm run start:worker
```

Wait for: `AI pipeline worker started`

### Terminal 4 â€” Frontend

```powershell
cd frontend
npm start
```

Open **http://localhost:4200**

### Shutdown (native)

```powershell
# Stop the 3 Node processes with Ctrl+C in each terminal, then:
cd infra
docker compose down
```

---

## Manual test flow

### Account

1. Go to `/register` (Docker: `http://localhost/register`, native: `http://localhost:4200/register`)
2. Fill in name, email, password â€” accept the consent checkbox
3. Submit â€” you'll see "Registration successful. Please verify your email."
4. Find the verification link:
   - **Docker:** `docker compose logs api | findstr verify`
   - **Native:** look in Terminal 2 for a line like:
     ```
     [dev-email] Verification link for you@example.com: http://localhost:4200/api/auth/verify?token=abc123...
     ```
5. Open that URL in the browser â†’ redirects to `/login?verified=1`
6. Log in with your credentials

### CV Upload

1. Go to `/app/cvs`
2. Upload a PDF or DOCX CV
3. Confirm the card appears in the list
4. Try uploading an invalid file (e.g. a `.txt`) â€” confirm a visible error appears

### New Application (Wizard)

1. Click **Neue Bewerbung** on the dashboard
2. Step 1: select the CV you uploaded
3. Step 2: paste a real job ad (min 50 characters)
4. Step 3: confirm â€” wizard creates the application and redirects to the editor

### Editor

1. Editor shows a skeleton with "KI optimiert deinen Lebenslaufâ€¦" while the AI job runs (typically 10â€“30 seconds)
2. Once done, the left panel shows the ATS score, matched keywords, and missing keywords
3. The center shows the optimized CV text â€” edit it, click outside to auto-save
4. The right panel shows 3 cover letter variants (Formal / Herzlich / Kurz) â€” switch and edit them
5. Click **Als gesendet markieren** to update the status

### PDF Download

1. Click **PDF herunterladen** in the top bar
2. Confirm `Lebenslauf.pdf` downloads and opens correctly

### Anonymous Trial (`/try`)

1. Go to `/try`
2. Paste raw CV text and a job ad
3. Confirm the response shows a score, matched/missing keywords, and a cover letter preview

### GDPR

1. Go to `/app/billing` (or the settings area)
2. Click **Daten exportieren** â€” confirm the downloaded JSON contains your user, master CVs, applications, and consents
3. Click **Konto lÃ¶schen**, confirm the dialog
4. Confirm that logging in with those credentials no longer works
