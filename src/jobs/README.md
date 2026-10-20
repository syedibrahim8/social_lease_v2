# Jobs

Background and scheduled work that runs outside the request/response cycle —
e.g. expiring stale campaigns, retrying failed payouts, sending digest emails.

Keep job handlers thin: they should call into the same **services** used by HTTP
controllers, never duplicate business logic. A scheduler (cron / queue worker)
is wired in here when the first job is introduced.

## Payment reconciler (`payment-reconcile.job.ts`)

Started from `server.ts` when Stripe is configured; runs every
`PAYMENT_RECONCILE_INTERVAL_MS` (default 5 min, `0` disables). It applies paid
Checkout Sessions whose webhook never arrived and finishes payout/refund claims
(`RELEASING`/`REFUNDING`) that a crash or timeout interrupted. All repairs go
through `paymentService`'s idempotent paths, so overlapping runs on several
instances cannot move money twice.
