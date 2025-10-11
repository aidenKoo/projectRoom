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
  - Force assign / delete actions require `X-Audit-Reason` and log to audit trail.

## Related

- Matching configs for experiments: `apps/api/src/match/config/scoring-config.ts`
  - Use the returned `variant` to select an experiment key or map variants to config keys in client/admin.
