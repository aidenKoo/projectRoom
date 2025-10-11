# Next Steps – A/B Experiments Console

## What’s Implemented (this pass)
- Assignment service & endpoints (client assignment, admin list/force/delete)
- Admin Web Experiments page (counts, stats, rollout editor)
- Weighted rollout & cohort filters (region/platform/new user) via `ab_experiments`
- Exposure & conversion metrics (events table, admin stats API)
- Auto conversion hook on match creation
- Docs updated: `doc/features/AB_EXPERIMENTS.md`

## Gaps / Next Steps
1. SDK/Client wiring
   - Client SDK helper to call assignment API + record exposures (web/mobile)
   - Cache assignments per session; invalidate on logout
2. Rollout operations
   - Redis-backed rollout gates / override flags
   - Config history & diff (audit log entries already recorded for assignments, extend to config changes)
3. Reporting & alerting
   - Scheduled job to snapshot experiment stats (daily aggregates)
   - Alert thresholds for conversion deltas
4. Productization
   - UI preset templates for common rollouts (50/50, staged rollout, cohort drilldown)
   - Experiment lifecycle (draft → running → completed)

## Suggested Order
1) SDK wiring + caching → 2) Rollout gates/overrides → 3) Reporting snapshots → 4) Lifecycle UI polish
