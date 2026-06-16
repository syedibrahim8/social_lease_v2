# Creator Asset Marketplace — Backend

Production-grade REST API foundation for a marketplace connecting **Brands** and
**Creators**. This repository currently contains the **foundation slice**: the
server, configuration, observability, security, and error-handling baseline that
every feature module is built on. Business modules (auth, campaigns, payments, …)
are added incrementally, one vertical slice at a time.

## Tech stack

| Concern         | Choice                                        |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js ≥ 20                                  |
| Language        | TypeScript (strict, CommonJS)                 |
| Web framework   | Express 4                                     |
| Database        | MongoDB via Mongoose 8                        |
| Validation      | Zod                                           |
| Logging         | Winston                                       |
| Security        | Helmet, CORS, express-rate-limit              |
| Package manager | pnpm                                          |
| Tooling         | ESLint 9 (flat), Prettier, Husky, lint-staged |

## Architecture

A **layered / Clean Architecture** with a strict dependency direction. Outer
layers depend on inner layers, never the reverse:

```
            HTTP request
                 │
   ┌─────────────▼─────────────┐
   │   routes  (URL → handler) │
   ├───────────────────────────┤
   │ controller (HTTP I/O)     │  parses input, returns ApiResponse
   ├───────────────────────────┤
   │ service   (use-cases)     │  business rules — framework-agnostic
   ├───────────────────────────┤
   │ repository (data access)  │  the only seam over Mongoose
   ├───────────────────────────┤
   │ model     (schema)        │  Mongoose documents
   └───────────────────────────┘
```

**Why this shape?**

- **Testability** — services hold business logic with no Express/Mongo coupling,
  so they unit-test cleanly; repositories are mockable.
- **Replaceability** — the data store sits behind repositories; controllers
  behind services. Either side can change without rippling through the app.
- **Single responsibility** — each file does one thing, which keeps modules
  small enough to reason about (and easier to review).

We use **feature-first modules** (`src/modules/<feature>/`) rather than one giant
top-level `controllers/`, `services/`, etc. With ~15 planned modules, grouping by
_feature_ keeps everything for "campaigns" in one place; grouping by _layer_ would
scatter it. The layers still exist — they live **inside** each module. See
[`src/modules/README.md`](src/modules/README.md).

## Folder structure

```
.
├── src/
│   ├── app.ts             # Express app: middleware wiring + route mounting (no port)
│   ├── server.ts          # Process entry: DB connect, listen, graceful shutdown
│   │
│   ├── config/            # Configuration layer (cross-cutting)
│   │   ├── env.ts         #   Zod-validated environment — single source of truth
│   │   ├── logger.ts      #   Winston logger (pretty in dev, JSON in prod)
│   │   ├── database.ts    #   Mongoose connection lifecycle + events
│   │   └── index.ts       #   barrel
│   │
│   ├── middleware/        # Express middleware (cross-cutting)
│   │   ├── requestContext.middleware.ts  # correlation id + access logging
│   │   ├── rateLimiter.middleware.ts     # global throttle
│   │   ├── notFound.middleware.ts        # 404 → ApiError
│   │   ├── error.middleware.ts           # global error handler (last in chain)
│   │   └── index.ts
│   │
│   ├── utils/             # Framework-light helpers
│   │   ├── ApiError.ts    #   operational error class + factories
│   │   ├── ApiResponse.ts #   standard success/error envelopes
│   │   ├── asyncHandler.ts#   async route wrapper → forwards errors to Express
│   │   ├── httpStatus.ts  #   typed HTTP status constants
│   │   └── index.ts
│   │
│   ├── routes/            # Root API router; mounts module routers + /health
│   │   ├── health.routes.ts
│   │   └── index.ts
│   │
│   ├── modules/           # Feature modules (business logic) — added per slice
│   ├── jobs/              # Background / scheduled work
│   ├── events/            # Domain events + handlers (decoupled side effects)
│   └── types/             # Global TypeScript / Express type augmentation
│
├── .env.example           # Documented env template (copy to .env)
├── tsconfig.json          # Strict, enterprise TS config (+ @/* path aliases)
├── tsconfig.build.json    # Build-only overrides (emit to dist/)
├── eslint.config.mjs      # ESLint 9 flat config (type-checked rules)
├── .prettierrc.json
└── .husky/pre-commit      # Runs lint-staged before each commit
```

### Why each top-level layer exists

- **`config/`** — all environment-dependent wiring in one place, validated at
  boot. Nothing else reads `process.env` directly.
- **`middleware/`** — cross-cutting request concerns (security, context, errors)
  shared by every route.
- **`utils/`** — small, dependency-light helpers reused everywhere. `ApiError`
  and `ApiResponse` are what give the API its consistent contract.
- **`routes/`** — the single, readable map of the API surface.
- **`modules/`** — where features live; isolated and independently testable.
- **`jobs/` / `events/`** — asynchronous and decoupled work, kept out of the
  request path.
- **`types/`** — shared ambient types and Express augmentation (`req.id`, later
  `req.user`).

## API response contract

Every endpoint returns one of two shapes (see [`ApiResponse`](src/utils/ApiResponse.ts)
and [`error.middleware.ts`](src/middleware/error.middleware.ts)):

```jsonc
// Success
{ "success": true, "message": "Success", "data": { /* ... */ }, "meta": { /* pagination, optional */ } }

// Error
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

The global error handler normalises `ApiError`, Zod, and Mongoose
(validation / cast / duplicate-key) errors into the error shape, logs 5xx with
stack traces, and hides internal details in production.

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env        # then edit values

# 3. Run in watch mode (needs MongoDB reachable at MONGODB_URI)
pnpm dev

# 4. Verify
curl http://localhost:8080/api/v1/health
```

### Scripts

| Script           | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Run with hot reload (tsx watch)                |
| `pnpm build`     | Type-check + emit to `dist/` (tsc + tsc-alias) |
| `pnpm start`     | Run the compiled build                         |
| `pnpm typecheck` | Type-check only, no emit                       |
| `pnpm lint`      | ESLint over the project                        |
| `pnpm format`    | Prettier write                                 |

## Key decisions

| Decision                | Choice & rationale                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Module system           | **CommonJS** — maximum compatibility with Node/Mongoose, no ESM extension footguns |
| Path aliases (`@/*`)    | Clean imports; `tsc-alias` rewrites them at build so prod `node dist/...` works    |
| `app` vs `server` split | `app.ts` exports the configured app (port-free) so integration tests skip the port |
| Env validation          | Zod + **fail-fast** at boot — misconfiguration crashes loudly, not subtly          |
| Error strategy          | One `ApiError` class + one global handler = a single, consistent error contract    |
| Graceful shutdown       | Drains connections + closes DB on SIGTERM/SIGINT so deploys don't drop requests    |

## Roadmap (next slices)

Auth (JWT + refresh + Google OAuth) → Users/Profiles → Campaigns → Applications &
Negotiation → Contracts → Payments (Stripe Connect) → Submissions → Reviews →
Notifications → Admin. Each slice is brainstormed, spec'd, implemented, and
verified on its own.
