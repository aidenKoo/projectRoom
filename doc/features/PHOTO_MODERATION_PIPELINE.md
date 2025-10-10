# 사진 모더레이션 파이프라인

## 개요

사진 모더레이션 파이프라인은 Firebase Storage 업로드부터 자동 심사까지 완전 자동화된 시스템입니다.

## 파이프라인 플로우

```
1. 사용자 업로드
   ↓
2. Firebase Storage 저장 (with metadata)
   ↓
3. Storage Webhook → Backend API
   ↓
4. PhotoMeta 생성/업데이트 (hash, width, height, bytes)
   ↓
5. Supabase Edge Function 호출 (content-moderator)
   ↓
6. Claude AI 모더레이션 분석
   ↓
7. Webhook → Backend (결과 저장)
   ↓
8. PhotoMeta 상태 업데이트 (approved/auto_flagged)
```

## 주요 기능

### 1. 해시 기반 중복 방지

**목적**: 동일한 사진이 여러 번 업로드되는 것을 방지

**구현**:
- Firebase Storage 메타데이터에서 해시 수집
- `PhotoMeta.hash` 필드에 저장
- `findDuplicateByHash()` 메서드로 중복 확인

**파일**: [photo-moderation.service.ts:77-87](../../apps/api/src/photos/photo-moderation.service.ts#L77-L87)

```typescript
async findDuplicateByHash(
  userId: number,
  hash: string,
): Promise<PhotoMeta | null> {
  if (!hash) return null;
  return this.photoMetaRepository.findOne({
    where: { userId, hash },
    relations: { photo: true },
  });
}
```

### 2. 재시도 로직

**목적**: 일시적인 네트워크 오류나 서버 오류 시 자동 재시도

**구현**:
- 지수 백오프 (1초 → 2초 → 4초)
- 최대 3회 재시도
- 4xx 에러 (429 제외)는 재시도하지 않음
- 5xx 에러와 429(Rate Limit)는 재시도

**파일**: [content-moderator/index.ts:22-69](../../supabase/functions/content-moderator/index.ts#L22-L69)

```typescript
async function callWebhookWithRetry(
  url: string,
  secret: string,
  payload: any,
  maxRetries: number = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": secret,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return response;
      }

      // Non-retriable errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Backend webhook responded with ${response.status}`);
      }

      lastError = new Error(`Backend webhook responded with ${response.status}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error("Webhook call failed after retries");
}
```

### 3. 자동 모더레이션

**플로우**:
1. Edge Function이 Claude AI에게 이미지 분석 요청
2. NSFW 여부, 신뢰도 점수, 라벨 반환
3. 웹훅으로 백엔드에 결과 전송
4. 백엔드가 PhotoMeta 상태 업데이트

**상태 전이**:
- `pending` → `approved` (안전한 콘텐츠)
- `pending` → `auto_flagged` (의심스러운 콘텐츠, 수동 검토 필요)

## 설정

### 환경 변수

**Backend API (.env)**:
```env
SUPABASE_FN_CONTENT_MODERATOR_URL=https://xxx.supabase.co/functions/v1/content-moderator
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PHOTO_MODERATION_WEBHOOK_SECRET=your-webhook-secret
```

**Supabase Edge Function**:
```env
PHOTO_MODERATION_WEBHOOK_URL=https://api.yourapp.com/internal/photos/moderation
PHOTO_MODERATION_WEBHOOK_SECRET=your-webhook-secret
ANTHROPIC_API_KEY=sk-ant-...
```

### Firebase Storage 메타데이터

업로드 시 다음 메타데이터를 포함하세요:

```typescript
const metadata = {
  customMetadata: {
    user_id: userId.toString(),
    photo_id: photoId.toString(),
    meta_id: metaId.toString(),
    hash: imageHash,  // 이미지 해시 (선택)
    width: width.toString(),
    height: height.toString(),
    bytes: fileSize.toString(),
    public_url: publicUrl
  }
};

await storageRef.put(file, { customMetadata: metadata });
```

## 데이터베이스 스키마

### photo_meta 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint | Primary Key |
| photo_id | bigint | 연결된 Photo ID (unique) |
| user_id | bigint | 사용자 ID |
| path | varchar(255) | Storage 경로 |
| hash | varchar(64) | 이미지 해시 (중복 방지) |
| width | int | 이미지 너비 |
| height | int | 이미지 높이 |
| bytes | bigint | 파일 크기 |
| status | enum | pending/approved/rejected/auto_flagged |
| nsfw | boolean | NSFW 여부 |
| nsfw_score | decimal(5,4) | NSFW 신뢰도 (0-1) |
| labels | json | 감지된 라벨 배열 |
| review_notes | varchar(255) | 검토 메모 |
| reviewed_by | varchar(64) | 검토자 ID |
| reviewed_at | datetime | 검토 일시 |

**인덱스**:
- `idx_user_status` - (user_id, status)
- `idx_hash` - (hash) - 중복 검색용
- `uniq_user_path` - (user_id, path) - 유니크 제약

## API 엔드포인트

### Internal Webhook

**POST** `/internal/photos/moderation`

백엔드 내부용 웹훅 엔드포인트입니다. Supabase Edge Function에서만 호출해야 합니다.

**Headers**:
```
x-webhook-secret: your-webhook-secret
Content-Type: application/json
```

**Body**:
```json
{
  "metaId": 123,
  "photoId": 456,
  "userId": 789,
  "result": {
    "flagged": false,
    "confidence": 0.95,
    "reasons": [],
    "severity": "low"
  }
}
```

## 모니터링

### 메트릭

- `photo_uploads_total{success="true|false"}` - 사진 업로드 총 개수
- `moderation_decisions_total{decision="approved|auto_flagged",automated="true|false"}` - 모더레이션 결정 총 개수

### 로그

```typescript
// 자동 모더레이션 요청 실패 시
this.logger.warn(
  `Content moderation request failed for photo ${photoId}: ${error.message}`
);

// Edge Function 로그
console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms`);
console.error("Content moderation error:", error);
```

## 트러블슈팅

### 자동 모더레이션이 작동하지 않는 경우

1. **Edge Function URL 확인**:
   ```bash
   curl -X POST $SUPABASE_FN_CONTENT_MODERATOR_URL \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"publicUrl":"...","metaId":1,"photoId":1,"userId":1}'
   ```

2. **웹훅 시크릿 확인**: Backend와 Edge Function의 시크릿이 일치하는지 확인

3. **Anthropic API 키 확인**: Edge Function 환경 변수에 올바른 키가 설정되어 있는지 확인

### 중복 방지가 작동하지 않는 경우

1. **해시 필드 확인**: Storage 메타데이터에 `hash` 필드가 포함되어 있는지 확인
2. **인덱스 확인**: `idx_hash` 인덱스가 생성되어 있는지 확인
3. **쿼리 로그 확인**: `findDuplicateByHash()` 호출 시 로그 확인

## 향후 개선 사항

- [ ] perceptual hash 기반 유사 이미지 감지
- [ ] 모더레이션 큐 우선순위 시스템
- [ ] 자동 승인 신뢰도 임계값 조정 (A/B 테스트)
- [ ] 배치 모더레이션 (한 번에 여러 이미지 처리)
- [ ] 사용자별 모더레이션 히스토리 대시보드
