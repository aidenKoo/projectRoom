# 디버깅 체크리스트

## 전수 디버깅 완료 (2025-10-12)

### ✅ TypeScript 타입 오류
- **상태**: 모두 수정 완료
- **빌드**: 성공 ✓
- **수정 사항**:
  - OpenTelemetry Resource import 수정
  - 미사용 import 제거 (context, headers, data 등)
  - match-scorer.service.ts의 token 파라미터 제거

### ✅ ESLint 오류
- **상태**: 모두 수정 완료
- **Lint**: 오류 없음 ✓
- **수정된 파일**:
  - `codes.service.ts` - CronExpression 미사용 import 제거
  - `tracing.interceptor.ts` - context, headers, data 미사용 변수 제거
  - `match-scorer.service.ts` - Not, In, firstValueFrom 미사용 import 제거
  - `match.controller.ts` - ApiResponse 미사용 import 제거
  - `moderation-webhook.dto.ts` - IsNotEmpty 미사용 import 제거
  - `user.entity.ts` - Profile 미사용 import 제거

### ✅ Null/Undefined 체크
- **photo-storage.controller.ts:67** - `photo.meta?.hash` → `metadata.hash`로 수정
  - 이유: photo.meta가 undefined일 수 있는데 옵셔널 체이닝 후 다시 접근 시도
- **users.service.ts** - `findByFirebaseUid()`가 이미 null 체크하고 예외 던짐 ✓
- **모든 컨트롤러** - FirebaseAuthGuard가 req.user 존재 보장 ✓

### ✅ 환경변수 누락 처리
모든 중요 환경변수는 적절히 처리됨:
- **DATABASE_*****: TypeORM이 자동으로 검증
- **SUPABASE_FN_CONTENT_MODERATOR_URL**: 누락 시 warning 로그 후 스킵
- **OTEL_*****: 선택적 기능, 기본값 제공

### ✅ 데이터베이스 스키마
- **photo_meta 테이블**: `idx_hash` 인덱스 추가 필요
- **마이그레이션**: [migrations/add_hash_index_to_photo_meta.sql](../apps/api/migrations/add_hash_index_to_photo_meta.sql)

## 잠재적 런타임 오류

### 🟡 주의사항

#### 1. 비동기 함수 에러 처리
**위치**: `photo-moderation.service.ts:195-240`
```typescript
async requestAutoModeration(meta: PhotoMeta, publicUrl: string): Promise<void> {
  // try-catch로 에러 처리 완료 ✓
  // 실패 시 warning 로그 후 계속 진행
}
```
**상태**: 적절히 처리됨

#### 2. 외부 API 호출 타임아웃
**위치**: `photo-moderation.service.ts:221`
```typescript
timeout: 15000, // 15초
```
**상태**: 타임아웃 설정됨 ✓

#### 3. Supabase Edge Function 재시도
**위치**: `supabase/functions/content-moderator/index.ts:22-69`
```typescript
async function callWebhookWithRetry(...)
// 최대 3회 재시도, 지수 백오프
```
**상태**: 재시도 로직 구현 완료 ✓

#### 4. WebSocket 연결 오류
**위치**: `websocket/chat.gateway.ts`
- 연결 실패 시 자동 재연결 로직 없음
- **권장**: 클라이언트에서 재연결 로직 구현

#### 5. Redis 연결 실패
**위치**: Rate limiting 기능
- Redis 장애 시 레이트 리밋 우회 가능
- **권장**: Redis 연결 health check 추가

## 성능 최적화 권장사항

### 1. 인덱스 누락 체크
```sql
-- photo_meta 테이블 인덱스 확인
SHOW INDEX FROM photo_meta;

-- 필수 인덱스:
-- - PRIMARY KEY (id)
-- - UNIQUE (photo_id)
-- - INDEX (user_id, status)
-- - UNIQUE (user_id, path)
-- - INDEX (hash) ← 새로 추가됨
```

### 2. N+1 쿼리 방지
- **사용 중인 relations**: 대부분 적절히 로드됨
- **getModerationQueue**: `leftJoinAndSelect` 사용 ✓
- **findByMatchId**: 관계 미리 로드 확인 필요

### 3. 트랜잭션 누락
**잠재적 문제**:
- Match 생성 시 양방향 레코드 생성
- Message 전송 시 여러 테이블 업데이트

**권장**:
```typescript
await this.dataSource.transaction(async (manager) => {
  // 원자적 작업들
});
```

## 보안 체크리스트

### ✅ 완료된 항목
- Firebase Auth 토큰 검증
- Rate limiting (Redis 기반)
- 입력 sanitization (SanitizeInterceptor)
- Webhook secret 검증
- Admin guard 적용

### 🟡 추가 권장사항
1. **SQL Injection**: TypeORM 사용으로 방어됨 ✓
2. **XSS**: class-validator로 입력 검증 ✓
3. **CSRF**: SPA이므로 JWT 사용으로 방어 ✓
4. **파일 업로드 제한**: Firebase Storage에서 처리 ✓

## 모니터링 체크포인트

### 중요 메트릭
1. **HTTP 에러율**: `http_errors_total / http_requests_total`
2. **응답 시간**: `http_request_duration_ms` (P95, P99)
3. **DB 쿼리 시간**: `db_query_duration_ms`
4. **모더레이션 성공률**: `moderation_decisions_total{automated="true"}`

### 알림 설정 권장
```yaml
# Prometheus Alert Rules
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        annotations:
          summary: "API error rate > 5%"

      - alert: SlowResponse
        expr: histogram_quantile(0.95, http_request_duration_ms) > 2000
        annotations:
          summary: "P95 latency > 2 seconds"

      - alert: ModerationFailure
        expr: rate(moderation_decisions_total{automated="false"}[10m]) > 0.5
        annotations:
          summary: "Auto moderation failure rate high"
```

## 배포 전 최종 체크리스트

- [ ] 환경 변수 모두 설정 (.env.example 참고)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] Redis 서버 실행 확인
- [ ] Firebase Admin SDK 인증 정보 설정
- [ ] Supabase Edge Functions 배포
- [ ] OpenTelemetry Collector 설정 (선택)
- [ ] 로그 수집 설정 (CloudWatch, Datadog 등)
- [ ] Health check 엔드포인트 테스트
- [ ] Smoke test 실행

## 테스트 명령어

```bash
# 빌드 테스트
npm run build

# Lint 체크
npm run lint

# 유닛 테스트 (TODO: 작성 필요)
npm run test

# E2E 테스트 (TODO: 작성 필요)
npm run test:e2e

# 마이그레이션 실행
mysql -u root -p projectroom < migrations/add_hash_index_to_photo_meta.sql
```

## 알려진 제한사항

1. **WebSocket 확장성**: Socket.io sticky session 필요
2. **파일 업로드**: Firebase Storage 용량 제한
3. **모더레이션**: Anthropic API rate limit (RPM 제한)
4. **Redis**: 단일 인스턴스 (고가용성 구성 필요)

## 연락처

문제 발견 시:
1. GitHub Issues에 보고
2. 긴급한 경우 온콜 담당자에게 연락
3. 로그 확인: CloudWatch/Datadog
