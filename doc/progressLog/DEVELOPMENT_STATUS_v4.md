# ProjectRoom - 개발 현황 보고서 v4

**작성일**: 2025-10-02
**프로젝트**: ProjectRoom (소개팅 웹앱)
**버전**: v4 - 인증/보안 및 Firebase Storage 통합

---

## 📋 개요

이번 버전에서는 Firebase 인증, 권한 관리, Rate Limiting, 그리고 이미지 업로드 기능을 추가했습니다.

---

## ✅ 완료된 작업 (v4)

### 1. Firebase Auth Guard

**목적**: Firebase ID Token 검증 및 사용자 인증

**구현 파일**:
- `apps/api/src/common/guards/firebase-auth.guard.ts`

**주요 기능**:
- ✅ Firebase Admin SDK 초기화
- ✅ Authorization Bearer Token 검증
- ✅ Firebase ID Token 검증
- ✅ 사용자 정보 request 객체에 추가 (uid, email, role)
- ✅ Custom Claims 지원 (role)

**사용 예시**:
```typescript
@Get('profile')
@UseGuards(FirebaseAuthGuard)
async getProfile(@Request() req) {
  const userId = req.user.uid;
  // ...
}
```

---

### 2. Admin Guard & Roles Guard

**목적**: 역할 기반 접근 제어 (RBAC)

**구현 파일**:
- `apps/api/src/common/guards/admin.guard.ts`
- `apps/api/src/common/guards/roles.guard.ts`

**주요 기능**:
- ✅ Admin 전용 엔드포인트 보호
- ✅ 역할 기반 권한 검증
- ✅ Decorator를 통한 간편한 적용

**사용 예시**:
```typescript
// Admin Guard
@Get('admin/users')
@UseGuards(FirebaseAuthGuard, AdminGuard)
async getUsers() { /* ... */ }

// Roles Guard
@Get('moderator/reports')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
async getReports() { /* ... */ }
```

---

### 3. Rate Limiting

**목적**: API 요청 제한으로 서버 과부하 방지

**구현 파일**:
- `apps/api/src/common/interceptors/rate-limit.interceptor.ts`
- `apps/api/src/common/decorators/rate-limit.decorator.ts`

**주요 기능**:
- ✅ Redis 기반 요청 카운팅
- ✅ 사용자별 요청 제한 (인증된 경우 uid, 미인증 시 IP)
- ✅ 시간 윈도우 설정 (기본 60초)
- ✅ 커스텀 제한 설정 가능

**동작 방식**:
- 기본 설정: 60초 동안 100회 요청 제한
- 제한 초과 시 429 Too Many Requests 응답

**사용 예시**:
```typescript
@Post('send-message')
@UseInterceptors(new RateLimitInterceptor(redisService, 10, 60))
async sendMessage() {
  // 60초 동안 10회만 허용
}
```

---

### 4. Storage Module (Firebase Storage)

**목적**: 사진 업로드 및 관리

**구현 파일**:
- `apps/api/src/storage/storage.service.ts`
- `apps/api/src/storage/storage.controller.ts`
- `apps/api/src/storage/storage.module.ts`

**주요 기능**:
- ✅ 이미지 업로드 (JPEG, PNG, WebP)
- ✅ 파일 크기 검증 (최대 10MB)
- ✅ Firebase Storage 통합
- ✅ 공개 URL 생성
- ✅ Signed URL 생성 (임시 접근)
- ✅ 파일 삭제

**API 엔드포인트**:
```
POST /storage/upload/photo     # 일반 사진 업로드
POST /storage/upload/profile   # 프로필 사진 업로드
```

**업로드 경로 구조**:
```
users/{userId}/photos/{uuid}.jpg
users/{userId}/profiles/{uuid}.jpg
```

**응답 예시**:
```json
{
  "success": true,
  "objectPath": "users/abc123/photos/uuid.jpg",
  "publicUrl": "https://storage.googleapis.com/bucket-name/users/abc123/photos/uuid.jpg"
}
```

---

## 📦 설치된 패키지

```json
{
  "firebase-admin": "^12.x",
  "uuid": "^9.x",
  "@nestjs/platform-express": "^10.x"
}
```

---

## 🔧 환경 변수 설정

### Firebase 관련 (.env)

```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Redis (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📊 전체 모듈 현황 (v4)

| 모듈 | 상태 | 설명 |
|------|------|------|
| Users | ✅ 완료 | 사용자 기본 정보 |
| Profiles | ✅ 완료 | 공개 프로필 |
| ProfilesPrivate | ✅ 완료 | 비공개 프로필 |
| Photos | ✅ 완료 | 사진 관리 |
| Preferences | ✅ 완료 | 선호도 Top N 랭킹 |
| Codes | ✅ 완료 | 월별 가입 코드 |
| Referrals | ✅ 완료 | 추천인 관리 |
| SurveyOptions | ✅ 완료 | 설문 옵션 마스터 |
| Match | ✅ 완료 | 매칭 알고리즘 |
| Conversations | ✅ 완료 | 대화방 및 메시지 |
| Admin | ✅ 완료 | 관리자 API |
| **Storage** | ✅ **신규** | **Firebase Storage 통합** |
| **Guards** | ✅ **신규** | **인증/권한 관리** |
| **Interceptors** | ✅ **신규** | **Rate Limiting** |
| Feed | 🔄 기존 | 피드 조회 |
| Swipes | 🔄 기존 | 스와이프 기록 |
| Matches (기존) | 🔄 기존 | 기존 매칭 로직 |
| Messages (기존) | 🔄 기존 | 기존 메시지 로직 |

---

## 🔐 보안 기능 요약

### 1. **인증 (Authentication)**
- Firebase ID Token 검증
- JWT 기반 사용자 인증
- Custom Claims 지원 (role)

### 2. **권한 (Authorization)**
- Admin Guard (관리자 전용)
- Roles Guard (역할 기반)
- Decorator 패턴으로 간편한 적용

### 3. **Rate Limiting**
- Redis 기반 요청 제한
- 사용자별/IP별 카운팅
- 429 Too Many Requests 응답

### 4. **파일 업로드 보안**
- MIME Type 검증
- 파일 크기 제한 (10MB)
- Firebase Storage 권한 관리

---

## 📝 남은 작업

### 🎯 최우선 순위

#### 1. **Firebase 프로젝트 설정**
- [ ] Firebase 프로젝트 생성
- [ ] Firebase Auth 설정 (Email/Password)
- [ ] Firebase Storage 설정
- [ ] 서비스 계정 키 발급
- [ ] .env 파일에 설정 추가

#### 2. **Flutter Web UI** (최우선)
- [ ] 프로젝트 초기 설정
- [ ] Firebase SDK 연동
- [ ] 가입 플로우 (Steps 0-5)
- [ ] Feed 페이지 (카드 스와이프)
- [ ] Matches/Chat 페이지
- [ ] Profile 페이지
- [ ] 이미지 업로드 구현

#### 3. **Admin 웹앱**
- [ ] React/Vue 프로젝트 생성
- [ ] 대시보드 UI
- [ ] 사용자 관리 페이지
- [ ] 코드/옵션 관리 페이지

### 🔧 백엔드 추가 작업

#### 4. **고급 기능**
- [ ] Audit Logs 구현
- [ ] 이미지 썸네일 생성 (Cloud Functions)
- [ ] NSFW 필터링
- [ ] 실시간 메시징 (WebSocket/FCM)
- [ ] AB 테스트 프레임워크

#### 5. **성능 최적화**
- [ ] Redis 캐싱 확대 적용
- [ ] DB 쿼리 최적화
- [ ] 인덱스 추가
- [ ] CDN 설정 (이미지)

### 🚀 배포 및 운영

#### 6. **인프라**
- [ ] Docker Compose 최종 검증
- [ ] MariaDB 마이그레이션 실행
- [ ] 프로덕션 환경 설정
- [ ] 모니터링 설정 (Sentry, Datadog 등)

#### 7. **테스트**
- [ ] 단위 테스트
- [ ] E2E 테스트
- [ ] 보안 테스트
- [ ] 성능 테스트

---

## 🎯 다음 우선순위

1. **Firebase 프로젝트 설정** - 서비스 계정 키 발급 및 .env 설정
2. **Flutter Web 프로젝트 시작** - 가입 플로우 구현
3. **Admin 웹앱 시작** - 대시보드 구현
4. **실제 데이터 테스트** - 엔드투엔드 테스트

---

## 📌 주요 기술 스택

- **Backend**: NestJS + TypeORM + MariaDB + Redis + Firebase Admin
- **Auth**: Firebase Auth (ID Token 검증)
- **Storage**: Firebase Storage
- **Security**: Guards + Rate Limiting
- **Frontend**: Flutter Web (예정)
- **Admin**: React/Vue (예정)
- **Infrastructure**: Docker Compose

---

## 📖 참고 문서

- [작업서.txt](/doc/작업서.txt) - 프로젝트 요구사항
- [DEVELOPMENT_STATUS_v3.md](./DEVELOPMENT_STATUS_v3.md) - 이전 개발 현황
- [README.md](/README.md) - 프로젝트 개요

---

**작성자**: Claude Code
**최종 업데이트**: 2025-10-02
