# CLAUDE.md — Bester.Builds

This file provides guidance for AI assistants working in this codebase.

## What This Project Is

**Bester.Builds** is a full-stack business automation platform for print shops. It covers CRM, inventory, orders, invoicing, payroll, job cards, employee shift tracking, and notifications. It runs as a web app, a PWA, and an Electron desktop app (Windows installer).

---

## Monorepo Layout

```
/
├── client/          # React 19 frontend (Vite)
├── server/          # Express + tRPC backend
├── shared/          # Types and constants shared between client and server
├── drizzle/         # Database schema (MySQL) and migrations
├── electron/        # Electron main/preload for desktop packaging
└── patches/         # pnpm patches (wouter)
```

### client/src/

| Directory        | Purpose                                              |
|------------------|------------------------------------------------------|
| `pages/`         | One file per route (20+ pages)                      |
| `components/ui/` | shadcn/ui generated primitives (50+ components)     |
| `components/`    | App-level components (layout, dialogs, kanban, etc.)|
| `hooks/`         | Custom React hooks                                  |
| `contexts/`      | ThemeContext (light/dark)                           |
| `lib/`           | tRPC client setup, utility functions                |

### server/

| File/Directory      | Purpose                                             |
|---------------------|-----------------------------------------------------|
| `_core/index.ts`    | Express server, PDF routes, OAuth, Vite setup       |
| `_core/context.ts`  | tRPC context (session, auth)                        |
| `_core/trpc.ts`     | tRPC router factory, procedure types                |
| `_core/oauth.ts`    | Google/Manus OAuth integration                      |
| `routers.ts`        | Main tRPC `appRouter` with all sub-routers (56 KB)  |
| `db.ts`             | All database query helpers via Drizzle ORM (65 KB)  |
| `pdf.ts`            | Invoice PDF generator (PDFKit)                      |
| `jobCardPdf.ts`     | Job card PDF generator                              |
| `payrollPdf.ts`     | Payroll report PDF generator                        |
| `storage.ts`        | AWS S3 integration (presigned URLs)                 |
| `*.test.ts`         | Vitest test files                                   |

---

## Technology Stack

| Layer       | Technology                                                     |
|-------------|----------------------------------------------------------------|
| Frontend    | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, shadcn/ui   |
| Routing     | Wouter 3 (client-side)                                         |
| State/API   | tRPC 11 + React Query 5                                        |
| Forms       | React Hook Form 7 + Zod 4                                      |
| Charts      | Recharts 2                                                     |
| Animations  | Framer Motion 12                                               |
| Backend     | Node.js, Express 4, tRPC 11                                    |
| Database    | MySQL via Drizzle ORM 0.44                                     |
| PDF         | PDFKit 0.17                                                    |
| Storage     | AWS S3 (`@aws-sdk/client-s3`)                                  |
| Auth        | bcryptjs, jose (JWT), session cookies                          |
| Testing     | Vitest 2                                                       |
| Package Mgr | pnpm 10                                                        |
| Desktop     | Electron 41, electron-builder (Windows NSIS .exe)              |

---

## Development Commands

```bash
pnpm dev              # Start dev server (tsx watch on server/_core/index.ts)
pnpm build            # Vite client build + esbuild server bundle → dist/
pnpm start            # Run production build
pnpm test             # Run Vitest test suite
pnpm check            # TypeScript strict typecheck (no emit)
pnpm format           # Prettier formatting
pnpm db:push          # Apply Drizzle schema migrations to database

# Electron desktop app
pnpm electron:build   # Build client + server for Electron
pnpm electron:package # Package to Windows NSIS .exe installer
pnpm electron:dist    # Build + package in one step
```

**Build outputs:**
- `dist/public/` — Vite static assets
- `dist/index.js` — ESM-bundled Express server
- `release/*.exe` — Windows NSIS installer

---

## TypeScript Path Aliases

Defined in `tsconfig.json`, shared across client, server, and Vitest:

```
@/*         → ./client/src/*
@shared/*   → ./shared/*
```

---

## Authentication System

The app supports two parallel auth flows:

1. **OAuth** — Google and Manus (`server/_core/oauth.ts`). Stores session in `users` table.
2. **Local auth** — Email + password (`localUsers` table, bcrypt hashed). Role: `admin` or `employee`.

The two auth flows use **separate cookies**:
- **OAuth** → `app_session_id` cookie (set in `server/_core/oauth.ts`; read via `sdk.authenticateRequest` in `server/_core/context.ts`)
- **Local auth** → `bester_local_session` cookie (set/read directly in handlers in `server/routers.ts` via `LOCAL_AUTH_COOKIE`)

**Procedure guards in tRPC:**
- `publicProcedure` — No middleware auth check; used for all local-auth endpoints (which verify `bester_local_session` in-handler) and truly public routes
- `protectedProcedure` — Checks `ctx.user`, which is populated **only from the OAuth session** (`app_session_id`). Local-auth users will always be `UNAUTHORIZED` if a procedure uses this guard — do not use it for local-auth routes
- Admin checks — Done inline per-procedure via role field

**Employee signup** is gated by an allowlist (`employeeAllowlist` table).

---

## tRPC API Structure

The `appRouter` in `server/routers.ts` is the single source of truth for all API procedures. Sub-routers:

`crm`, `inventory`, `orders`, `invoices`, `employees`, `tasks`, `payments`, `analytics`, `scheduling`, `shifts`, `notifications`, `jobCards`, `pricing`, `payroll`, `company`, `auth`, `allowlist`, `system`

**Pattern for a procedure:**
```ts
// Query
someRouter.someQuery: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    return await db.getSomething(input.id);
  }),

// Mutation
someRouter.someMutation: protectedProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ input, ctx }) => {
    return await db.createSomething(input);
  }),
```

All inputs are validated with Zod. Errors are thrown as `TRPCError` with codes like `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`.

**PDF downloads** are not tRPC — they are plain Express routes:
- `GET /api/invoices/:id/pdf`
- `GET /api/payroll/pdf`
- `GET /api/job-cards/:id/pdf`

---

## Database

**ORM:** Drizzle ORM with MySQL  
**Schema:** `drizzle/schema.ts`  
**Relations:** `drizzle/relations.ts`  
**Migrations:** `drizzle/*.sql` (12 migrations, applied via `pnpm db:push`)  
**Config:** `drizzle.config.ts` (requires `DATABASE_URL` env var)

**Key tables:** `users`, `localUsers`, `employeeAllowlist`, `customers`, `interactions`, `leads`, `inventoryItems`, `inventoryTransactions`, `orders`, `orderItems`, `invoices`, `employees`, `shiftLogs`, `tasks`, `appointments`, `payments`, `pricingRates`, `companyProfile`, `notifications`, `jobCards`

All DB query helpers live in `server/db.ts`. Add new queries there rather than writing Drizzle queries inline in routers.

---

## Testing

**Framework:** Vitest 2 (Node environment)  
**Location:** `server/**/*.test.ts`  
**Run:** `pnpm test`

**Test files:**
| File                      | Coverage                                |
|---------------------------|-----------------------------------------|
| `bester.test.ts`          | Core routers (CRM, orders, shifts, auth)|
| `localAuth.test.ts`       | Local email/password auth               |
| `auth.logout.test.ts`     | Logout procedure                        |
| `jobCard.test.ts`         | Job card CRUD + PDF                     |
| `shiftApproval.test.ts`   | Shift approval workflow                 |
| `notifications.test.ts`   | Notification system                     |
| `isOverdue.test.ts`       | Overdue job card detection              |

**Conventions:**
- Mock `./db` with `vi.mock("./db")` and provide realistic mock return values
- Use `describe()` per router/feature, `it()` per case
- Test: auth guards, input validation, error handling, happy path
- All 138 tests should pass — run `pnpm test` before committing

---

## Code Style & Conventions

**Formatter:** Prettier (`pnpm format`)
- 80 character line width
- Semicolons: yes
- Trailing commas: all
- Single quotes

**TypeScript:** Strict mode. Run `pnpm check` to validate types without emitting.

**Frontend patterns:**
- Pages go in `client/src/pages/`
- Reusable UI primitives go in `client/src/components/ui/` (shadcn-managed)
- App-specific components go in `client/src/components/`
- Forms use React Hook Form with a Zod resolver
- Toasts via `sonner` (`toast.success()`, `toast.error()`)
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Theme-aware: use Tailwind `dark:` variants, not hard-coded colors

**Backend patterns:**
- New tRPC procedures go in `server/routers.ts` under the appropriate sub-router
- New DB queries go in `server/db.ts`
- Use `protectedProcedure` for OAuth-session-protected endpoints (most admin operations)
- Use `publicProcedure` when auth is handled in the handler itself — this is common and intentional for: PIN kiosk endpoints (unauthenticated by design), employee portal routes (JWT cookie checked inline), session management (me/logout), and notifications/allowlist (role checked in handler). Do not "fix" these to `protectedProcedure` — that would break the kiosk and employee portal flows
- Throw `new TRPCError({ code: "UNAUTHORIZED" })` for auth failures, not plain errors

---

## Environment Variables

The server reads from `.env` via `server/_core/env.ts`. Required variables:

```
DATABASE_URL              # MySQL connection string (also used by drizzle.config.ts)
JWT_SECRET                # Cookie signing secret + JWT signing (falls back to "fallback-secret" if unset — set this in production)
OAUTH_SERVER_URL          # Manus OAuth server base URL
OWNER_OPEN_ID             # OAuth owner identifier
VITE_APP_ID               # Application ID for OAuth/Manus integration
BUILT_IN_FORGE_API_URL    # Storage proxy base URL (replaces AWS S3)
BUILT_IN_FORGE_API_KEY    # Storage proxy auth token
```

Optional:

```
PORT                      # HTTP port (default: 3000)
NODE_ENV                  # "production" enables production mode
```

> Note: Storage uses a Manus/Forge proxy (`BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY`), **not** AWS S3. There are no AWS env vars.

---

## PWA / Mobile

The app is a Progressive Web App:
- **Manifest:** `client/public/manifest.json`
- **Service worker:** `client/public/sw.js` (cache-first for static assets, network-first for API)
- **Install banner:** `client/src/components/PwaInstallBanner.tsx` (Android native + iOS manual)

Mobile layout conventions:
- 2-column grids on mobile, 4-column on desktop
- Sidebar is overlay on mobile (toggle via DashboardLayout)
- Dialogs capped at `95dvh` on mobile
- Job card kanban uses horizontal scroll on small screens

---

## Electron Desktop App

**Entry:** `electron/main.cjs` — spawns the Express server, opens a BrowserWindow  
**Preload:** `electron/preload.cjs`  
**Packaging:** `electron-builder.yml` → Windows NSIS `.exe` installer  
**Auto-updates:** `electron-updater` via GitHub Releases (needs `GH_TOKEN` + code signing secrets)

Build the desktop app with `pnpm electron:dist`. Output goes to `release/`.

---

## Key Business Logic

- **Print Cost Calculator** — Real-time pricing from `pricingRates` table based on dimensions, material, and finishing (`orders` router)
- **Job Card Kanban** — Drag-and-drop board (`JobCardKanban.tsx`) with 4 status columns; overdue cards highlighted in red
- **Shift Approval Workflow** — Employees clock in/out via PIN kiosk; admins approve/reject in ShiftApproval page; notifications sent on status change
- **Payroll Reports** — Aggregate approved shifts by employee, calculate pay, generate branded PDF
- **Quote-to-Invoice** — Orders can be converted to invoices with PO number field
- **isOverdue()** helper in `server/routers.ts` — checks job card due date against current time

---

## What NOT to Do

- Do not write Drizzle queries inline in `routers.ts` — put them in `db.ts`
- Do not add new UI primitives to `components/ui/` manually — those are shadcn-managed
- Do not use `npm` or `yarn` — this project uses `pnpm`
- Do not push to `main` directly — use feature branches and PRs
- Do not skip `pnpm check` and `pnpm test` before committing
