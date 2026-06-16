# Jobs

Background and scheduled work that runs outside the request/response cycle —
e.g. expiring stale campaigns, retrying failed payouts, sending digest emails.

Keep job handlers thin: they should call into the same **services** used by HTTP
controllers, never duplicate business logic. A scheduler (cron / queue worker)
is wired in here when the first job is introduced.
