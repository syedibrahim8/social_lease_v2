# Events

Event-driven, decoupled side effects. When something significant happens
(`application.accepted`, `campaign.funded`, `submission.approved`), the owning
service emits a domain event; handlers here react — sending notifications,
writing audit logs, kicking off payouts — without the emitter knowing about them.

This keeps core use-cases focused and makes side effects easy to add or remove.
A typed event emitter/bus is added here when the first event is introduced.
