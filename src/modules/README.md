# Feature Modules

Business functionality lives here as **self-contained feature modules**. Each
module owns its full vertical slice, so a feature can be understood, changed, and
tested in isolation without hunting across the codebase.

## Anatomy of a module

```
src/modules/<feature>/
├── <feature>.routes.ts        # Express router — maps HTTP verbs/paths to controllers
├── <feature>.controller.ts    # HTTP layer — parses input, calls service, sends ApiResponse
├── <feature>.service.ts       # Business logic / use-cases (no Express, no Mongo specifics)
├── <feature>.repository.ts    # Data access — the ONLY place that touches the Mongoose model
├── <feature>.model.ts         # Mongoose schema + model
├── <feature>.validators.ts    # Zod schemas for request validation
└── <feature>.types.ts         # Module-local TypeScript types/DTOs
```

## Dependency direction (Clean Architecture)

```
routes → controller → service → repository → model
```

- **Controllers** never talk to the database directly.
- **Services** never touch `req`/`res` — they receive plain data and return plain data.
- **Repositories** are the single seam over Mongoose, so the data store can be
  swapped or mocked in tests.

## Cross-cutting layers (shared, top-level)

These already exist and are consumed by every module:

| Layer        | Location         | Responsibility                                   |
| ------------ | ---------------- | ------------------------------------------------ |
| `config`     | `src/config`     | env, logger, database connection                 |
| `middleware` | `src/middleware` | auth, validation, errors, rate limiting, context |
| `utils`      | `src/utils`      | `ApiError`, `ApiResponse`, `asyncHandler`, etc.  |
| `types`      | `src/types`      | global/Express type augmentation                 |
| `jobs`       | `src/jobs`       | background/scheduled work                        |
| `events`     | `src/events`     | event bus + domain event handlers                |

## Planned modules (built slice by slice)

`auth` · `users` · `creators` · `brands` · `campaigns` · `applications` ·
`negotiations` · `contracts` · `payments` · `wallets` · `submissions` ·
`reviews` · `notifications` · `disputes` · `admin`

Each is its own brainstorm → spec → implement cycle.
