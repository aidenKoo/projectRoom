# A/B Experiments

Minimal A/B assignment service and APIs.

## Data Model

- Table: `ab_assignments`
  - `id` BIGINT PK
  - `user_id` BIGINT NOT NULL
  - `experiment` VARCHAR(40)
  - `variant` VARCHAR(20)
  - Unique: `(user_id, experiment)`

Entity: `apps/api/src/experiments/entities/ab-assignment.entity.ts`

## Assignment Logic

- Deterministic bucketing on first request: `hash(userId:experiment) % variants.length`
- Default variants: `["A","B"]`
- Force assignment for admin supported.

## Endpoints

- GET `v1/experiments/assignment?experiment=<key>&variants=A&variants=B`
  - Auth: Firebase user
  - Returns: `{ experiment, variant }`
  - Optional: `record=1` to auto-record an exposure

- GET `admin/experiments/assignments?experiment=<key>&variant=<name>&page=1&limit=20`
  - Auth: Admin
  - Returns paginated assignments

- GET `admin/experiments/variants?experiment=<key>`
  - Auth: Admin
  - Returns variant counts

- POST `admin/experiments/assignments`
  - Auth: Admin
  - Body: `{ userId, experiment, variant }`
  - Force create/update
  - Requires header: `X-Audit-Reason: <why>`

- DELETE `admin/experiments/assignments/:id`
  - Auth: Admin
  - Requires header: `X-Audit-Reason: <why>`

- GET `admin/experiments/overrides`
  - Auth: Admin
  - Returns active overrides stored in Redis

- GET `admin/experiments/overrides/:experiment`
  - Auth: Admin
  - Returns `{ experiment, override: { variant, expiresAt? } | null }`

- POST `admin/experiments/overrides`
  - Auth: Admin
  - Body: `{ experiment, variant, ttlSeconds? }`
  - Requires header: `X-Audit-Reason`
  - Overrides deterministic assignment immediately (respects optional `variants` filter)

- DELETE `admin/experiments/overrides/:experiment`
  - Auth: Admin
  - Requires header: `X-Audit-Reason`
  - Clears override

### Snapshots & Reporting

- GET `admin/experiments/snapshots?experiment=<key>&limit=30`
  - Auth: Admin
  - Returns recent records from `ab_experiment_snapshots` (date, exposures, conversions, rate)

- POST `admin/experiments/snapshots/capture`
  - Auth: Admin, requires `X-Audit-Reason`
  - Body: `{ date?: "YYYY-MM-DD" }` (defaults to today)
  - Aggregates `ab_events` for the day and upserts snapshot rows

- Cron: `ExperimentsService.handleDailySnapshot` runs nightly (`EVERY_DAY_AT_1AM`) to capture the previous day's data.

### Config History

- GET `admin/experiments/config/history?experiment=<key>&limit=50`
  - Auth: Admin
  - Returns recent changes `{ changeType, payload, actor, reason, recordedAt }`
- Entries are recorded automatically when rollout configs are updated (`changeType: "config"`) or overrides are set/cleared (`override_set`/`override_clear`).

### Metrics

- POST `v1/experiments/events`
  - Auth: Firebase user
  - Body: `{ experiment, event: 'exposure'|'conversion', variant?, properties? }`
  - Records exposure/conversion. If `variant` omitted, uses assigned variant.

- GET `admin/experiments/stats?experiment=<key>&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
  - Auth: Admin
  - Returns variant-level exposures, conversions, and conversion rate.

### Rollout Config

- GET `admin/experiments/config/:experiment`
  - Auth: Admin
  - Returns `{ experiment, config }`. `config` may be `null` when defaulting to legacy 50/50 hash.

- PUT `admin/experiments/config/:experiment`
  - Auth: Admin
  - Body:

```json
{
  "defaultVariant": "A",
  "variants": [
    { "key": "A", "weight": 0.4 },
    { "key": "B", "weight": 0.6, "filters": { "platforms": ["ios"], "regions": ["SEOUL_GANGNAM"], "newUserDays": 30 } }
  ]
}
```

- Variants
  - `weight`: positive number; normalized automatically per eligible cohort.
  - `filters` (optional): restrict rollout to specific `regions`, `platforms`, or `newUserDays` (days since signup).
- Assignment behavior
  - Variants whose filters match the user + optional `platform` query participate in weighted deterministic bucketing.
  - If no variant matches filters, fallback to filtered variants without cohort or `defaultVariant`.

### Automatic Conversions

- `MatchService.createMatch` triggers conversions for both participants
  - Resolves numeric userId and records `conversion` for every active experiment assignment.
  - Event properties: `{ source: 'match', uidA, uidB }`.

### Admin UI

- Experiments page (`/experiments`)
  - Displays variant counts + exposure/conversion stats + preview of scoring config.
  - `Edit Rollout` button opens JSON editor for weights/cohort filters.
  - `Override Variant` modal manages Redis overrides with TTL + audit logging.
  - Force assign / delete actions require `X-Audit-Reason` and log to audit trail.

### Client Helper

- `useExperimentAssignment(experiment, options)` (admin-web/src/hooks)
  - Fetches assignment with optional variant list, caches per session, auto-records exposure (configurable).
  - Returns `{ variant, loading, error, recordExposure, recordConversion, refresh }`.
  - Uses `recordExperimentEvent` for conversion tracking; cache TTL defaults to 6h.

## Related

- Matching configs for experiments: `apps/api/src/match/config/scoring-config.ts`
  - Use the returned `variant` to select an experiment key or map variants to config keys in client/admin.
