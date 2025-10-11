# ProjectRoom – Photo Pipeline Integration Notes

## 1. What Was Implemented
- **Backend**
  - Added `photo_meta` entity with moderation status fields (`pending/auto_flagged/approved/rejected`), NSFW flags, reviewer notes, and timestamps.
  - `PhotoModerationService` orchestrates Supabase Content Moderator Edge Function calls (fire-and-forget) and persists metadata updates.
  - `PhotosService` now auto-creates moderation metadata on upload, filters out non-approved photos when fetching, and ensures hashes/bytes/size are stored.
  - New admin endpoints:
    - `GET /admin/moderation/photos?status=…` – moderation queue with user/profile context.
    - `POST /admin/moderation/photos/:id/decision` – applies approve/reject decisions (requires `X-Audit-Reason`).
- **Database**
  - `docker/mariadb/init.sql` seeds `photo_meta` table with foreign keys and indexes.
  - `migration-v8.sql` captures schema delta for existing environments.
- **Admin Web**
  - Added Match Queue + Moderation menu entries.
  - Implemented `PhotoModeration` page (queue table, filters, preview, approve/reject modal).
- **Client Web (Flutter)**
  - `PhotosPage` now relies on backend pipeline:
    - Uploads to Firebase Storage, sends metadata (hash, size, dims) to API.
    - Displays moderation status, NSFW flags, and primary-photo control.
    - Enforces “2 approved photos before completion”.

## 2. Configuration Checklist
- `.env`: set `SUPABASE_FN_CONTENT_MODERATOR_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Ensure Supabase Edge Function `content-moderator` deploy url matches env var.
- Apply `docker/mariadb/migration-v8.sql` (or regenerate schema if running fresh).

## 3. Outstanding Gaps / Next Steps
1. **Supabase Trigger Flow**
   - ✅ Edge Function이 백엔드 Webhook으로 결과를 전달하도록 전환(2025-10-12 완료).
   - ✅ Storage 업로드 → `/internal/photos/storage/upload` webhook 경유로 자동 심사 요청(백엔드 엔드포인트 + Cloud Function 연계 완료).
   - 🔄 Cloud Function: 재시도(지수 백오프) 구현 완료, 알람은 GCP Log 기반 구성 필요. Secrets 설정 가이드 추가(docs/operations/CLOUD_FUNCTIONS_SETUP.md).
  - 🔄 Cloud Function: 해시/메타데이터(width/height/bytes/public_url) 수집 및 전달 구현(백엔드 저장 경로 연동), 운영 환경 검증 필요.
2. **NSFW Auto Flow**
   - ✅ Edge Function이 `type: "photo"` 처리 시 이미지 비전 모더레이션 호출하도록 수정.
   - [ ] 모더레이션 결과의 라벨/점수 구조화 저장(JSON: `{ provider, label, score }`).
3. **Admin UI Enhancements**
   - ✅ 상태·검색·날짜 필터 및 페이지네이션 추가(2025-10-12 완료).
   - [ ] Batch actions (approve/reject multiple).
   - [ ] Display audit trail (fetch from `audit_logs`).
4. **Client UX**
   - Polling / subscriptions for moderation status changes (currently manual refresh).
   - Add tooltip explaining each status, highlight rejected items requiring replacement.
5. **Testing**
   - Add e2e test for photo upload → moderation queue.
   - Unit tests for `PhotoModerationService` covering auto-flag, manual decision.

## 4. Reference Paths
- Backend:
  - `apps/api/src/photos/photo-moderation.service.ts`
  - `apps/api/src/admin/admin.service.ts`
  - `apps/api/src/admin/admin.controller.ts`
  - `apps/api/src/photos/photos.service.ts`
- Admin Web:
  - `apps/admin-web/src/pages/PhotoModeration.tsx`
  - `apps/admin-web/src/services/api.ts`
  - `apps/admin-web/src/App.tsx`
- Client Web:
  - `apps/web/lib/pages/photos_page.dart`
  - `apps/web/lib/services/api_service.dart`
  - `apps/web/lib/services/storage_service.dart`

## 5. How to Continue
1. Update Supabase Edge Function to push moderation result back (webhook or queue) and adjust backend to receive callbacks.
2. Extend admin API with pagination/search for moderation queue.
3. Sync Flutter UI with new endpoints (e.g., show audit notes, auto-refresh).
