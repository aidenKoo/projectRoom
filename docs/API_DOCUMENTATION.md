# API Documentation

## Overview

전체 API는 Swagger/OpenAPI 3.0으로 문서화되어 있습니다.

**Swagger UI 접속:**
```
http://localhost:3000/api/docs
```

---

## API Endpoints Summary

### 1. Authentication & Users

#### Users (`/v1/users`)
- `POST /sync` - Sync user from Firebase to database
- `GET /me` - Get current user info

**Auth**: Firebase JWT Required

---

### 2. Profile Management

#### Profiles (`/v1/profiles`)
- `POST /` - Create user profile
- `GET /:firebaseUid` - Get profile by Firebase UID
- `PATCH /:firebaseUid` - Update profile
- `DELETE /:firebaseUid` - Delete profile

#### Private Profiles (`/v1/profiles-private`)
- `GET /me` - Get own private profile
- `PATCH /me` - Update own private profile

#### Preferences (`/v1/preferences`)
- `POST /` - Create matching preferences
- `GET /me` - Get own preferences
- `PATCH /me` - Update preferences

**Auth**: Firebase JWT Required

---

### 3. Photos

#### Photo Management (`/v1/photos`)
- `POST /` - Upload photo
- `GET /me` - Get own photos
- `PATCH /:id` - Update photo metadata
- `DELETE /:id` - Delete photo
- `PATCH /:id/primary` - Set photo as primary

#### Photo Storage (`/internal/photos/storage`)
- `POST /uploaded` - Handle upload webhook (Firebase Storage)

#### Photo Moderation (`/internal/photos/moderation`)
- `POST /` - Handle moderation webhook (Edge Function)

**Moderator Endpoints:**
- `GET /admin/photos/moderation/queue` - Get moderation queue
- `POST /admin/photos/:id/approve` - Approve photo
- `POST /admin/photos/:id/reject` - Reject photo

**Auth**: Firebase JWT Required (User) / Admin Guard (Moderator)

---

### 4. Matching & Recommendations

#### Match (`/v1/match`)
- `GET /recommendations` - Get recommendations
- `POST /recommendations/generate` - Generate recommendations
- `POST /like` - Like a user
- `GET /likes/received` - Get likes received
- `GET /matches` - Get matches
- `GET /matches/:id` - Get match by ID
- `POST /matches/:id/answers` - Submit initial answers
- `POST /recommendations/:targetUserId/skip` - Skip recommendation

#### Match Configuration (`/admin/match/config`) - **Admin Only**
- `GET /` - Get default configuration
- `GET /experiments` - Get all experimental configs
- `GET /experiments/:key` - Get specific experiment config

#### Match Benchmark (`/v1/match/benchmark`) - **Analytics Permission**
- `GET /config/validate` - Validate scoring config
- `GET /config/list` - List all configs
- `GET /statistics` - Get scoring statistics
- `GET /compare` - Compare configurations
- `GET /performance` - Measure scoring performance

**Auth**: Firebase JWT Required (User) / Permission-Based (Admin/Analytics)

---

### 5. Conversations & Messages

#### Conversations (`/v1/conversations`)
- `GET /` - Get all conversations
- `GET /:id` - Get conversation by ID
- `GET /:id/messages` - Get messages in conversation

#### Messages (`/v1/messages`)
- `POST /` - Send message
- `PATCH /:id/read` - Mark message as read
- `GET /unread/count` - Get unread message count

**Auth**: Firebase JWT Required

---

### 6. Administration

#### Admin Dashboard (`/admin`)
- `GET /stats` - Get dashboard statistics
- `GET /users` - Get users (with filters)
- `GET /users/:uid` - Get user details
- `PATCH /users/:uid/ban` - Ban user
- `PATCH /users/:uid/unban` - Unban user
- `GET /match/queue` - Get match queue (with filters)

**Filters for Match Queue:**
- `userId` - Filter by user ID
- `targetUserId` - Filter by target user ID
- `minScore` - Minimum score
- `maxScore` - Maximum score
- `dateFrom` - Date from
- `dateTo` - Date to
- `page` - Page number
- `limit` - Items per page

#### Statistics (`/v1/statistics`)
- `GET /` - Get general statistics
- `GET /experiments` - Get experiment statistics

#### Audit Logs (`/v1/audit-logs`)
- `GET /` - Get paginated audit logs (with filters)
- `GET /user/:uid` - Get logs for target user
- `GET /actor/:uid` - Get logs by actor
- `GET /stats` - Get audit log statistics

**Auth**: Admin Guard / Permission-Based

---

### 7. Codes & Referrals

#### Monthly Codes (`/admin/codes`)
- `POST /generate` - Generate monthly code
- `GET /` - Get all codes
- `PATCH /:id/toggle` - Toggle code active status

#### Code Validation (`/v1/codes`)
- `POST /validate` - Validate signup code

**Auth**: Admin Guard (Generate) / Public (Validate)

---

### 8. A/B Experiments

#### Experiments (`/v1/experiments`) - **Work in Progress**
- `GET /assignment` - Get user's experiment assignment
- `POST /assignment` - Assign user to experiment

**Admin Endpoints:**
- `GET /admin/experiments` - Get all experiments
- `POST /admin/experiments/assign` - Force assign user
- `DELETE /admin/experiments/:id/user/:userId` - Remove assignment

**Auth**: Firebase JWT Required / Admin Guard

---

## Authentication

### Firebase JWT

모든 사용자 엔드포인트는 Firebase ID Token이 필요합니다:

```bash
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
     http://localhost:3000/v1/users/me
```

### Admin Access

관리자 엔드포인트는 추가로 Admin 권한이 필요합니다:

```typescript
// User metadata in Firebase Auth
{
  role: 'admin' | 'moderator' | 'user'
}
```

### Permission-Based Authorization

세분화된 권한 시스템:

```typescript
enum Permission {
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  MODERATE_PHOTO = 'moderate:photo',
  READ_AUDIT_LOGS = 'read:audit_logs',
  READ_ANALYTICS = 'read:analytics',
  // ... 25+ permissions
}
```

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-11T10:30:00Z"
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": {
    "field": "email",
    "constraint": "must be a valid email"
  }
}
```

### Paginated Response

```json
{
  "items": [ ... ],
  "meta": {
    "totalItems": 1234,
    "itemsPerPage": 50,
    "currentPage": 1,
    "totalPages": 25,
    "hasNextPage": true
  }
}
```

---

## Rate Limiting

고빈도 엔드포인트에 레이트 리밋이 적용되어 있습니다:

- **General API**: 100 requests / 15 minutes per IP
- **Photo Upload**: 10 uploads / hour per user
- **Message Send**: 50 messages / hour per user
- **Admin Actions**: 200 requests / 15 minutes

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641900000
```

---

## Swagger Tags

API는 다음 태그로 분류되어 있습니다:

- `users` - User management
- `profiles` - Public profiles
- `profiles-private` - Private profiles
- `preferences` - Matching preferences
- `photos` - Photo management
- `match` - Matching & recommendations
- `match-benchmark` - Scoring benchmarks
- `conversations` - Conversations
- `messages` - Messages
- `admin` - Administration
- `statistics` - Statistics
- `audit-logs` - Audit logs
- `codes` - Signup codes
- `experiments` - A/B experiments

---

## OpenAPI Spec Export

OpenAPI 3.0 스펙을 JSON으로 내보내기:

```bash
curl http://localhost:3000/api/docs-json > openapi.json
```

---

## Code Generation

Swagger Codegen으로 클라이언트 SDK 생성:

```bash
# TypeScript/JavaScript
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/docs-json \
  -g typescript-axios \
  -o ./sdk/typescript

# Dart (Flutter)
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/docs-json \
  -g dart \
  -o ./sdk/dart

# Swift (iOS)
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api/docs-json \
  -g swift5 \
  -o ./sdk/swift
```

---

## Testing with Swagger UI

1. **Authorize**:
   - Click "Authorize" button
   - Enter Firebase ID Token
   - Click "Authorize"

2. **Try Endpoints**:
   - Select endpoint
   - Click "Try it out"
   - Fill parameters
   - Click "Execute"

3. **View Response**:
   - Response body
   - Response headers
   - Response code

---

## Postman Collection

Postman 컬렉션 가져오기:

1. Postman 열기
2. Import → Link
3. 입력: `http://localhost:3000/api/docs-json`
4. Import 클릭

---

## API Versioning

현재 버전: **v1**

모든 엔드포인트는 `/v1` prefix를 사용합니다:
- `/v1/users/me`
- `/v1/profiles/:uid`
- `/v1/match/recommendations`

향후 Breaking Changes 시 `/v2` 도입 예정.

---

## Deprecation Policy

API 변경 정책:

1. **6개월 전 공지**: Deprecated 마크
2. **3개월 전**: 대체 API 제공
3. **Sunset Date**: 완전 제거

Deprecated 엔드포인트는 Swagger에 표시:
```yaml
deprecated: true
description: "Use /v2/endpoint instead. Will be removed on 2025-06-01"
```

---

## Best Practices

### 1. Always Use HTTPS in Production

```bash
# ✅ Good
https://api.yourapp.com/v1/users/me

# ❌ Bad
http://api.yourapp.com/v1/users/me
```

### 2. Handle Rate Limits

```typescript
if (response.status === 429) {
  const retryAfter = response.headers['retry-after'];
  await sleep(retryAfter * 1000);
  // Retry request
}
```

### 3. Validate Responses

```typescript
const response = await api.get('/v1/users/me');

if (!response.data) {
  throw new Error('Invalid response format');
}

// Use TypeScript types
const user: User = response.data;
```

### 4. Implement Exponential Backoff

```typescript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

---

## Support

API 관련 문의:
- Swagger UI: `http://localhost:3000/api/docs`
- GitHub Issues: `https://github.com/yourrepo/issues`
- Email: `api-support@yourapp.com`
