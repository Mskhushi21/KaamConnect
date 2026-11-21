# KaamConnect — Local Job Discovery & Worker Hiring Platform

KaamConnect is a full-stack local employment and worker hiring platform connecting local workers with households, shops, restaurants, workshops, and businesses across Karnataka and India. It provides full trilingual support (**English**, **Kannada**, **Hindi**), role-based dashboards (Worker, Employer, Admin), persistent SQLite storage, and community safety moderation.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide Icons
- **Backend:** Node.js, Express (`server.ts`), `tsx`
- **Database:** SQLite (`better-sqlite3`) with WAL mode, foreign keys, and relational schema
- **Security:** `bcryptjs` password hashing, HMAC-signed HTTP-only session cookies stored in SQLite, `X-CSRF-Token` verification, server-side input validation, and role-based access control (RBAC)

---

## Key Features

1. **Three-Language Support (English, ಕನ್ನಡ, हिन्दी):**
   - Switch languages from the navigation bar or Account Settings.
   - Language preference is saved in `localStorage` and synced to the user's database profile across sessions.
2. **Role-Based Registration & Authentication:**
   - Separate Worker and Employer registration flows with duplicate email/mobile prevention.
   - Role-protected dashboards for **Workers**, **Employers**, and **Administrators**.
3. **Job Discovery & Location Filtering:**
   - 15 local job categories (Construction, Domestic & Household Work, Delivery, Hotel & Restaurant, Retail, Tailoring, Repair & Maintenance, Cleaning, Factory & Warehouse, Gardening & Agriculture, Security, Office Assistant, Event Workers, Drivers, General Helpers).
   - Cascading State -> District -> City -> Area/Locality selector focused on Karnataka alongside major Indian cities.
   - Filtering by keyword, category, location, work type, monthly/daily wage range, experience, and date posted, plus sorting.
4. **End-to-End Application Workflow:**
   - Workers apply once per job (duplicate applications blocked), save jobs, withdraw pending applications, and track status updates (`Pending`, `Under Review`, `Accepted`, `Rejected`, `Withdrawn`).
   - Employers publish, edit, close, reopen, mark filled, or delete listings, and accept/reject applicants with optional notes and notifications.
5. **Safety & Admin Moderation:**
   - Employers can hide their phone number until an application is accepted.
   - Automatic keyword check flags listings containing recruitment-fee phrases for Admin review.
   - Report Job & Report Employer modals, Admin moderation console, account suspension, and one-click sample data removal.

---

## Netlify Website Deployment

The React website starts at the root `index.html`, which loads `main.tsx` and `App.tsx`. Netlify runs `bun run build` from the repository root and publishes `dist`, as configured in `netlify.toml`. Vite bundles the application and stylesheet into `dist/assets` and copies files from `public` into `dist`.

The Netlify routing rules serve `index.html` for React routes, including direct links and refreshes at `/jobs`, `/login`, and `/register/worker`. Existing static assets are served directly.

The existing Express/SQLite backend is not deployed by the static Vite build. `/api/*` requests retain an error response instead of receiving the React HTML page. Account actions and database-backed listings require a separate backend deployment; the website routing fix does not enable those services.

## Running Locally (Windows / VS Code / macOS / Linux)

### 1. Prerequisites
- Install **Node.js 20+** (includes `npm`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and update secrets before production use:
```bash
cp .env.example .env
```
(On Windows PowerShell: `Copy-Item .env.example .env`)

Environment variables:
- `PORT` (default `3000`)
- `SESSION_SECRET` — long random string for signing session cookies
- `SQLITE_DB_PATH` — path to SQLite file (default `./data/kaamconnect.db`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — initial administrator account credentials

### 4. Initialize Database & Run Development Server
Database tables, indexes, the initial administrator account, and clearly marked sample listings are initialized automatically on first startup:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Build & Run in Production
```bash
npm run build
NODE_ENV=production npm start
```
(On Windows PowerShell: `$env:NODE_ENV="production"; npm start`)

---

## Sample Data & Administrator Access

- Default bootstrap Admin credentials are defined via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (defaults in `.env.example`: `admin@kaamconnect.in` / `Admin@KaamConnect2026`). Change these immediately in any live environment.
- Initial sample listings and sample accounts (`is_sample = 1`) are clearly labeled as **Sample listing** and can be removed in one click from **Admin Console -> Platform Overview -> Remove All Sample Data**.
