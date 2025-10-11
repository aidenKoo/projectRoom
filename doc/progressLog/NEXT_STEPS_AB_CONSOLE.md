# Next Steps – A/B Experiments Console

## What’s Implemented (this pass)
- Assignment service & endpoints (client assignment, admin list/force/delete)
- Admin Web Experiments page (counts, stats, rollout editor)
- Weighted rollout & cohort filters (region/platform/new user) via `ab_experiments`
- Exposure & conversion metrics (events table, admin stats API)
- Auto conversion hook on match creation
- Client assignment hook (`useExperimentAssignment`) with session cache + exposure logging
- Redis-based experiment overrides + admin UI controls
- Docs updated: `doc/features/AB_EXPERIMENTS.md`

## Gaps / Next Steps
1. SDK adoption
   - Integrate helper into consumer apps (web/mobile) + logout cache invalidation
   - Provide conversion helper wrappers per funnel step
2. Rollout operations
   - Config history & diff (audit log entries already 기록 중, 추가 확장)
   - Bulk override management (per-cohort overrides)
3. Reporting & alerting
   - Alert thresholds for conversion deltas + Slack/Email 알림
   - Snapshot visualization (Admin UI 차트)
4. Productization
   - UI preset templates for common rollouts (50/50, staged rollout, cohort drilldown)
   - Experiment lifecycle (draft → running → completed)
5. Developer experience
   - Helper 패키지 문서화 및 예제, 자동 테스트 확장

## Suggested Order
1) SDK adoption → 2) Config history → 3) Alerting/visualization → 4) Lifecycle UI polish
