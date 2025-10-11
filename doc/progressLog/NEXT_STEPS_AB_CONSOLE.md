# Next Steps – A/B Experiments Console

## What’s Implemented (this pass)
- Backend A/B assignment entity/service
- Endpoints
  - Client: `GET /v1/experiments/assignment?experiment=KEY&variants=A&variants=B`
  - Admin: list/force/delete assignments, variant counts
- Deterministic bucketing by userId+experiment
- Docs at `doc/features/AB_EXPERIMENTS.md`

## Gaps / Next Steps
1. Admin Web UI
   - Page: Experiments list → variant counts, filters, pagination
   - Force assign modal; delete action
   - Link to `match-config` experiments for config preview
2. SDK/Client wiring
   - Hook assignment API to select `experimentKey` for `getScoringConfig`
   - Cache per session; refresh on login
3. Weights & targeting
   - Support weighted variants and cohort targeting (region, platform, etc.)
   - Optional: Redis-backed rollout gates
4. Metrics
   - Add experiment exposure and conversion events
   - Statistics service: aggregate by experiment/variant over time
5. Safety/Policy
   - Admin audit logs for force assignments and deletions
   - Input validation for experiment/variant naming conventions

## Suggested Order
1) Admin UI table + counts → 2) Exposure metrics → 3) Weighted rollout → 4) Targeting → 5) Cleanup & docs

