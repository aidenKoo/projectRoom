# Serverless Migration Guide

## Overview

Backend 크론 작업들을 Supabase Edge Functions로 마이그레이션하여 서버리스 아키텍처로 전환했습니다.

## Migrated Functions

### 1. Monthly Code Generator (`monthly-code-generator`)

**기능:** 매월 1일 자동으로 가입코드 생성
**이전:** `apps/api/src/codes/codes.service.ts` - `@Cron("0 0 1 * *")`
**현재:** `supabase/functions/monthly-code-generator/index.ts`

**크론 스케줄:**
```
0 0 1 * * (KST)
```

**설정 방법 (Supabase Dashboard):**
1. Database → Extensions → `pg_cron` 활성화
2. SQL Editor에서 실행:
```sql
SELECT cron.schedule(
  'monthly-code-generator',
  '0 15 1 * *', -- UTC 15:00 = KST 00:00 (다음날)
  $$
  SELECT
    net.http_post(
      url := 'https://[PROJECT_REF].supabase.co/functions/v1/monthly-code-generator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
```

**수동 트리거:**
```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/monthly-code-generator \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"maxUses": null}'
```

---

### 2. Recommendation Cleanup (`recommendation-cleanup`)

**기능:** 72시간 이상 경과한 추천 데이터 정리
**이전:** `apps/api/src/match/match.service.ts` - `cleanupOldRecommendations()`
**현재:** `supabase/functions/recommendation-cleanup/index.ts`

**크론 스케줄:**
```
0 3 * * * (KST) - 매일 03:00
```

**설정 방법 (Supabase Dashboard):**
```sql
SELECT cron.schedule(
  'recommendation-cleanup',
  '0 18 * * *', -- UTC 18:00 = KST 03:00 (다음날)
  $$
  SELECT
    net.http_post(
      url := 'https://[PROJECT_REF].supabase.co/functions/v1/recommendation-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
```

**수동 트리거:**
```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/recommendation-cleanup \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

---

## Deployment

### Edge Functions 배포

```bash
# 전체 함수 배포
supabase functions deploy

# 개별 함수 배포
supabase functions deploy monthly-code-generator
supabase functions deploy recommendation-cleanup
```

### 환경 변수 설정

Edge Functions는 자동으로 다음 환경 변수를 사용합니다:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

추가 환경 변수가 필요한 경우:
```bash
supabase secrets set KEY=VALUE
```

---

## Monitoring

### Logs 확인

**Supabase Dashboard:**
- Edge Functions → Logs → 함수 선택

**CLI:**
```bash
supabase functions logs monthly-code-generator
supabase functions logs recommendation-cleanup
```

### Cron Job 상태 확인

```sql
-- 등록된 크론 작업 조회
SELECT * FROM cron.job;

-- 크론 실행 이력 조회
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Benefits

### 1. 비용 절감
- 백엔드 서버 상시 구동 불필요
- 실행 시간만큼만 과금 (Supabase 무료 티어: 500K 함수 실행/월)

### 2. 확장성
- 자동 스케일링
- 트래픽 증가에 따른 인프라 관리 불필요

### 3. 유지보수
- 함수별 독립 배포 가능
- 백엔드 코드와 분리되어 장애 격리

### 4. 모니터링
- Supabase Dashboard에서 실시간 로그 확인
- 함수별 실행 통계 제공

---

## Rollback Plan

Edge Function이 실패하는 경우, 백엔드에서 임시로 수동 실행 가능:

```typescript
// apps/api/src/codes/codes.service.ts
// 크론 데코레이터를 다시 추가하여 롤백
@Cron("0 0 1 * *", {
  name: "generate-monthly-code",
  timeZone: "Asia/Seoul",
})
async autoGenerateMonthlyCode() {
  const code = await this.generateMonthlyCode();
  console.log(`✅ [CRON] 월별 가입코드 자동 생성 완료: ${code.code}`);
  return code;
}
```

---

## Future Improvements

1. **Recommendation Generation**: 추천 생성 로직도 Edge Function으로 마이그레이션 고려
2. **Analytics Processing**: 통계 집계 작업 서버리스화
3. **Notification Delivery**: 알림 발송 배치 작업 분리
4. **Image Processing**: 이미지 리사이징/최적화 작업 Cloud Functions 이전

---

## References

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs Guide](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Deno Deploy Pricing](https://deno.com/deploy/pricing)
