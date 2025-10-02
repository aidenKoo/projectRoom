# ProjectRoom - 개발 현황

## ✅ 완료된 작업

### Backend (NestJS)

#### 1. 기본 인프라
- ✅ TypeORM + MariaDB 연동
- ✅ Redis 캐싱 서비스 구현
- ✅ Firebase Authentication Guard
- ✅ Swagger API 문서화
- ✅ Docker Compose 설정 (MariaDB, Redis, NestJS, Adminer, RedisInsight)

#### 2. 완성된 모듈

##### Users Module
- ✅ Entity, Service, Controller
- ✅ Firebase UID 동기화 기능
- ✅ POST /v1/users/sync
- ✅ GET /v1/users/me

##### Profiles Module
- ✅ Entity, Service, Controller
- ✅ DTO (Create, Update)
- ✅ POST /v1/profiles (프로필 생성)
- ✅ GET /v1/profiles/me (내 프로필 조회)
- ✅ GET /v1/profiles/:userId (타인 프로필 조회)
- ✅ PATCH /v1/profiles (프로필 수정)

##### Photos Module
- ✅ Entity, Service, Controller
- ✅ DTO (Create, Update)
- ✅ POST /v1/photos (사진 등록)
- ✅ GET /v1/photos?me=1 (내 사진 목록)
- ✅ PATCH /v1/photos/:id (사진 수정 - 대표 사진 설정)
- ✅ DELETE /v1/photos/:id (사진 삭제)

##### Preferences Module
- ✅ Entity, Service, Controller
- ✅ DTO (Create, Update)
- ✅ POST /v1/preferences (선호도 생성/업데이트)
- ✅ GET /v1/preferences (내 선호도 조회)
- ✅ PATCH /v1/preferences (선호도 수정)
- ✅ DELETE /v1/preferences (선호도 삭제)

##### Feed Module
- ✅ Entity, Service, Controller
- ✅ GET /v1/feed (매칭 피드 조회)
- ✅ v0 규칙 기반 스코어링 알고리즘
- ✅ 매칭 이유(reasons) 생성
- ✅ 설정 가능한 가중치 (환경변수)

##### Swipes Module
- ✅ Entity, Service, Controller
- ✅ POST /v1/swipes (좋아요/패스/슈퍼라이크)
- ✅ 상호 매칭 감지 및 Match 생성

##### Matches Module
- ✅ Entity, Service, Controller
- ✅ GET /v1/matches (매칭 목록)
- ✅ GET /v1/matches/:id (매칭 상세)

##### Messages Module
- ✅ Entity, Service, Controller
- ✅ GET /v1/messages/:matchId (메시지 목록)
- ✅ POST /v1/messages/:matchId (메시지 전송)

##### Codes Module
- ✅ Entity, Service, Controller
- ✅ 월간 초대 코드 시스템

#### 3. Database
- ✅ MariaDB 스키마 (init.sql)
- ✅ 모든 테이블 정의 (users, profiles, photos, preferences, swipes, matches, messages, reports, blocks, user_metrics)
- ✅ 상호 좋아요 → 자동 매칭 트리거

#### 4. 캐싱 & 성능
- ✅ Redis 서비스 구현
- ✅ Global Cache Module
- ✅ JSON 직렬화/역직렬화 지원

### Frontend (Flutter Web)

#### 1. 기본 설정
- ✅ Firebase 설정 (Auth, Storage)
- ✅ Riverpod 상태 관리
- ✅ go_router 라우팅
- ✅ dio HTTP 클라이언트
- ✅ freezed + json_annotation

#### 2. 프로젝트 구조
- ✅ lib/models/ (데이터 모델)
- ✅ lib/pages/ (화면)
- ✅ lib/providers/ (상태 관리)
- ✅ lib/routes/ (라우팅)
- ✅ lib/services/ (API, Firebase)
- ✅ lib/widgets/ (재사용 위젯)

### DevOps

#### 1. Docker
- ✅ Dockerfile (Multi-stage build)
- ✅ .dockerignore
- ✅ docker-compose.yml (전체 서비스 오케스트레이션)

#### 2. 환경 설정
- ✅ .env.example (모든 필요한 환경변수 정의)
- ✅ 매칭 알고리즘 가중치 설정
- ✅ CORS 설정

## 📋 다음 단계 (권장)

### 1. Firebase 설정
```bash
# Firebase 프로젝트 생성 및 인증 정보 설정
# .env 파일에 Firebase credentials 추가
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=...
```

### 2. 서비스 시작
```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 또는 로컬에서 개발
cd apps/api
npm install
npm run start:dev

# Flutter Web
cd apps/web
flutter pub get
flutter run -d chrome
```

### 3. Flutter 페이지 구현
- [ ] Welcome 페이지
- [ ] SignIn 페이지
- [ ] Profile Setup 페이지
- [ ] Values 선택 페이지
- [ ] Photos 업로드 페이지
- [ ] Feed 페이지 (카드 스와이프)
- [ ] Matches 목록 페이지
- [ ] Chat 페이지
- [ ] Me (내 프로필) 페이지

### 4. API 통합
- [ ] Firebase Auth + API 인증 연동
- [ ] 프로필 생성/수정 API 연동
- [ ] 사진 업로드 (Firebase Storage → API)
- [ ] 매칭 피드 API 연동
- [ ] 스와이프 API 연동
- [ ] 채팅 API 연동

### 5. 고급 기능
- [ ] Feed 캐싱 (Redis)
- [ ] 실시간 메시징 (WebSocket/SSE)
- [ ] 푸시 알림
- [ ] 신고/차단 기능
- [ ] 사용자 메트릭 추적
- [ ] A/B 테스트 (매칭 알고리즘)

## 🎯 매칭 알고리즘 (v0)

현재 구현된 규칙 기반 스코어링:

```typescript
S = w1*공통태그점수 + w2*가치관합치 + w3*시간대겹침
  + w4*거리점수 + w5*응답성 + w6*품질점수
```

가중치는 `.env`에서 조정 가능:
- WEIGHT_COMMON_TAGS=0.25
- WEIGHT_VALUES_MATCH=0.20
- WEIGHT_TIME_OVERLAP=0.15
- WEIGHT_DISTANCE=0.15
- WEIGHT_RESPONSIVENESS=0.15
- WEIGHT_QUALITY_SCORE=0.10

## 📚 API 문서

서비스 시작 후 접속:
- Swagger UI: http://localhost:3001/docs
- Adminer (DB): http://localhost:8081
- RedisInsight: http://localhost:5540

## 🔐 보안

- ✅ Firebase Authentication Guard
- ✅ JWT 토큰 검증
- ✅ 본인 리소스만 수정 가능 (사진, 프로필 등)
- ✅ CORS 설정
- ⚠️  Rate Limiting (TODO)
- ⚠️  Input Sanitization (TODO)

## 🧪 테스트

```bash
# Backend
cd apps/api
npm test

# E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 참고 문서

- [README.md](README.md) - 전체 프로젝트 개요
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase 설정 가이드
- [작업서.txt](작업서.txt) - 원본 요구사항
