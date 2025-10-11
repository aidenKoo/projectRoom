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

## Related

- Matching configs for experiments: `apps/api/src/match/config/scoring-config.ts`
  - Use the returned `variant` to select an experiment key or map variants to config keys in client/admin.
