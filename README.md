# ProjectRoom - Dating App

안전하고 효율적인 매칭을 제공하는 데이팅 앱 (작업서 기반)

## 🏗️ 아키텍처

### Stack Overview

```
┌─────────────────┐
│  Flutter Web    │  ← 클라이언트 (Firebase Auth/Storage)
│  (Riverpod)     │
└────────┬────────┘
         │ HTTP (dio)
         │ Firebase ID Token
         ↓
┌─────────────────┐
│   NestJS API    │  ← 백엔드 (TypeORM, Swagger)
│   (:3001)       │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌────────┐
│MariaDB │ │ Redis  │  ← 데이터베이스 & 캐시
│ (:3306)│ │(:6379) │
└────────┘ └────────┘
```

### 클라이언트: Flutter Web
- **Auth**: Firebase Authentication (Email/Google)
- **Storage**: Firebase Storage (사진 업로드)
- **State**: Riverpod
- **Routing**: go_router
- **HTTP**: dio (NestJS API 호출)
- **PWA**: 기본 캐시

### 백엔드: NestJS
- **Framework**: NestJS (TypeScript)
- **Database**: MariaDB (TypeORM)
- **Cache**: Redis (피드 캐시, 레이트리밋, 후보 풀)
- **Auth**: Firebase ID Token 검증
- **API Docs**: Swagger (`/docs`)

### 데이터베이스: MariaDB
- users (Firebase UID 매핑)
- profiles, photos, preferences
- swipes, matches, messages
- reports, blocks, user_metrics

## 🚀 Quick Start

### 1. 환경 설정

```bash
# 환경변수 복사
cp .env.example .env

# Firebase 프로젝트 설정 필요:
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
```

### 2. Docker 서비스 시작

```bash
# 모든 서비스 시작 (MariaDB, Redis, NestJS)
docker-compose up -d

# 서비스 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f nestjs
```

### 3. Flutter Web 실행

```bash
cd apps/web

# 의존성 설치
flutter pub get

# Firebase 설정 (firebase_options.dart 생성 필요)
# firebase login
# flutterfire configure

# 개발 서버 실행
flutter run -d chrome
```

### 4. NestJS 개발 (로컬)

```bash
cd apps/api

# 의존성 설치
npm install

# 개발 모드 실행
npm run start:dev

# API 문서 접속: http://localhost:3001/docs
```

## 📍 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Flutter Web | http://localhost:5000 | 웹 클라이언트 |
| NestJS API | http://localhost:3001 | REST API |
| Swagger Docs | http://localhost:3001/docs | API 문서 |
| Adminer | http://localhost:8080 | DB 관리 (MariaDB) |
| RedisInsight | http://localhost:5540 | Redis 관리 |

## 📁 Project Structure

```
projectRoom/
├── apps/
│   ├── web/                    # Flutter Web 클라이언트
│   │   ├── lib/
│   │   │   ├── main.dart
│   │   │   ├── routes/         # go_router 설정
│   │   │   ├── pages/          # 화면별 페이지
│   │   │   ├── widgets/        # 재사용 위젯
│   │   │   ├── providers/      # Riverpod providers
│   │   │   ├── services/       # API, Firebase
│   │   │   └── models/         # Data models (freezed)
│   │   └── pubspec.yaml
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── users/          # 모듈별 구조
│       │   ├── profiles/
│       │   ├── photos/
│       │   ├── preferences/
│       │   ├── feed/           # 매칭 피드 (v0 규칙)
│       │   ├── swipes/
│       │   ├── matches/
│       │   ├── messages/
│       │   └── common/         # Guards, Interceptors
│       └── package.json
│
├── docker/
│   └── mariadb/
│       └── init.sql            # DB 스키마
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🎯 핵심 기능 (작업서 기반)

### 화면 구성 (Flutter Web)
```
/welcome → /signin → /profile-setup → /values → /photos
  → /feed → /matches → /chat/:id → /me
```

#### 주요 페이지
- **/feed**: 카드 스택 + 퀵필터 (거리/연령/흡연/종교/자녀)
- **/matches**: 최근 메시지/안읽음 뱃지
- **/chat/:matchId**: 텍스트/이미지 채팅
- **/me**: 프로필 편집

#### 필수 위젯
- `AppScaffold`, `AuthGate`
- `PhotoGrid` (웹 업로더)
- `ProfileCard`, `ReasonBadge`
- `FilterBar`, `MatchTile`
- `ChatView`, `ReportDialog`

### API 엔드포인트

#### Auth (Firebase ID Token)
```
Authorization: Bearer <Firebase ID Token>
```

#### Users
- `POST /v1/users/sync` - Firebase UID 동기화
- `GET /v1/users/me` - 내 정보 조회

#### Photos
- `POST /v1/photos` - 사진 등록
- `GET /v1/photos?me=1` - 내 사진 목록
- `PATCH /v1/photos/:id` - 사진 수정
- `DELETE /v1/photos/:id` - 사진 삭제

#### Feed (매칭 알고리즘 v0)
- `GET /v1/feed?limit=20&cursor=...&filters=...`
  - 카드 + reasons[] 반환

#### Swipes
- `POST /v1/swipes`
  - Body: `{ targetId, action: 'like'|'pass'|'superlike' }`
  - Response: `{ matched: bool, matchId? }`

#### Matches
- `GET /v1/matches` - 매칭 목록
- `GET /v1/matches/:id` - 매칭 상세 (상대 요약)

#### Messages
- `GET /v1/messages/:matchId?cursor=...`
- `POST /v1/messages/:matchId`
  - Body: `{ body?, type: 'text'|'image' }`

## 🧮 매칭 알고리즘 (v0 규칙 기반)

### 후보생성 (Candidate Generation)
- **하드 필터**: 양방향 선호 만족 (나이, 거리, 흡연/종교/자녀)
- **제외**: 차단/신고, 최근 N일 pass
- **가용성**: 최근 7일 활동자 우선

### 스코어링 (Scoring)
```
S = w1*공통태그점수 + w2*가치관합치 + w3*시간대겹침
  + w4*거리점수 + w5*응답성 + w6*품질점수
```

**가중치** (.env 설정):
- `WEIGHT_COMMON_TAGS=0.25`
- `WEIGHT_VALUES_MATCH=0.20`
- `WEIGHT_TIME_OVERLAP=0.15`
- `WEIGHT_DISTANCE=0.15`
- `WEIGHT_RESPONSIVENESS=0.15`
- `WEIGHT_QUALITY_SCORE=0.10`

### 리즌 배지 (설명가능성)
상위 기여 피처 Top3를 한국어 문구로 노출:
- "공통 취미 3개"
- "퇴근시간대 유사"
- "8km 이내"

### 성능 최적화
- **후보풀 캐싱**: Redis (5~15분)
- **스코어 계산**: 상위 200명만 → 20개 노출

### v1 학습형 (옵션)
- 알고리즘: LightGBM/GBDT
- 타깃: `P(match → 첫메시지)`
- 주간 재학습

## 🔥 Firebase 설정

### 1. Firebase 프로젝트 생성
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# Flutter 프로젝트에 Firebase 추가
cd apps/web
flutterfire configure
```

### 2. Storage Rules
```javascript
// user_photos: 본인 쓰기/인증 읽기
match /user_photos/{userId}/{photoId} {
  allow write: if request.auth.uid == userId;
  allow read: if request.auth != null;
}

// thumbnails: 공개 읽기
match /thumbnails/{userId}/{photoId} {
  allow read: if true;
}
```

### 3. Auth 설정
- Email/Password 활성화
- Google OAuth 설정 (선택)

## 🔧 개발 가이드

### Flutter Web

#### 상태 관리 (Riverpod)
```dart
// providers/auth_provider.dart
final authProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});
```

#### API 호출 (dio)
```dart
// services/api_service.dart
class ApiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:3001',
  ));

  Future<void> setAuthToken(String token) async {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
}
```

#### 라우팅 (go_router)
```dart
// routes/app_router.dart
final router = GoRouter(
  routes: [
    GoRoute(path: '/feed', builder: (context, state) => FeedPage()),
    GoRoute(path: '/chat/:id', builder: (context, state) => ChatPage(
      matchId: state.pathParameters['id']!,
    )),
  ],
);
```

### NestJS

#### Module 생성
```bash
cd apps/api
nest g module feed
nest g controller feed
nest g service feed
```

#### Entity 정의
```typescript
// users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  firebase_uid: string;

  @Column()
  email: string;
}
```

#### Guard 적용
```typescript
@Controller('v1/feed')
@UseGuards(FirebaseAuthGuard)
export class FeedController {
  @Get()
  async getFeed(@Request() req) {
    const firebaseUid = req.user.uid;
    // ...
  }
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

#### users
```sql
id, firebase_uid (UNIQUE), email, display_name,
gender, birth_year, region_code, created_at, updated_at
```

#### profiles
```sql
user_id (PK), height_cm, job_group, edu_level,
religion, drink, smoke, intro_text, values_json (JSON)
```

#### swipes
```sql
id, actor_id, target_id, action ENUM('like','pass','superlike'),
created_at, UNIQUE(actor_id, target_id)
```

#### matches (자동 생성 트리거)
```sql
id, user_a, user_b, status ENUM('active','closed'),
created_at, UNIQUE(user_a, user_b)
```

### Trigger: 상호 좋아요 → 매칭
```sql
CREATE TRIGGER create_match_on_mutual_like
AFTER INSERT ON swipes
-- 상호 like 시 matches 테이블에 자동 삽입
```

## 🧪 테스트

### Flutter
```bash
cd apps/web
flutter test
```

### NestJS
```bash
cd apps/api

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📈 KPI & 메트릭

### 핵심 지표
- **퍼널**: 노출 → 좋아요 → 매치 → 첫메시지
- **전환율**: 첫메시지 전환율, 대화 5턴 도달율
- **가드레일**: 신고율/차단율 상승 시 롤백

### 리즌별 성과 추적
- 어떤 리즌이 '좋아요'/'첫메시지'에 기여?
- 성/연령/지역 그룹별 공정성 지표

## 🐛 Troubleshooting

### MariaDB 연결 오류
```bash
docker-compose logs mariadb
docker exec -it projectroom-mariadb mysql -u projectroom -p
```

### Redis 연결 확인
```bash
docker exec -it projectroom-redis redis-cli ping
# PONG
```

### NestJS 빌드 오류
```bash
cd apps/api
rm -rf dist node_modules
npm install
npm run build
```

### Firebase 설정 오류
```bash
cd apps/web
flutterfire configure --force
```

## 📚 Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Flutter Web](https://docs.flutter.dev/platform-integration/web)
- [Firebase](https://firebase.google.com/docs)
- [TypeORM](https://typeorm.io/)
- [Riverpod](https://riverpod.dev/)
- [go_router](https://pub.dev/packages/go_router)

## 📝 작업서 원문

전체 기능 명세는 [작업서.txt](작업서.txt) 참조
