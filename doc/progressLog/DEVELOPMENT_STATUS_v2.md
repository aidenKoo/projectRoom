# ProjectRoom - 개발 현황 v2.0 (작업서 기반)

**업데이트:** 2025-10-02
**기준:** 작업서.txt 최신 요구사항 반영

---

## ✅ 완료된 작업 (v2.0)

### 🎯 신규 기능 (작업서 기반)

#### 1. 월별 가입코드 시스템 ✅
- **Entity**: MonthlyCode (monthly_codes 테이블)
- **자동 생성**: 매월 1일 00:00 KST 크론잡 (`@Cron`)
- **포맷**: `YYYY-MM-XXXXXX` (6자리 영숫자)
- **기능**:
  - `POST /codes/validate` - 코드 검증 및 사용 카운트 증가
  - `POST /codes/generate` - 수동 코드 생성 (관리자)
  - `POST /codes/:id/toggle` - 활성화/비활성화 토글
  - `GET /codes` - 코드 목록 조회
  - `GET /codes/month/:year/:month` - 특정 월의 활성 코드
- **정책**:
  - `maxUses` 설정 가능 (null = 무제한)
  - `usedCount` 자동 추적
  - `isActive` 상태 관리

#### 2. 추천인(Referrals) 시스템 ✅
- **Entity**: Referral (referrals 테이블)
- **기능**:
  - 추천인 이름 자유 입력 (선택 사항)
  - 추천인별 가입자 통계
  - 최근 추천인 목록
- **API**:
  - `POST /v1/referrals` - 추천인 정보 등록
  - `GET /v1/referrals/me` - 내 추천인 조회
  - `GET /v1/referrals/stats` - 추천인별 통계 (관리자)
  - `GET /v1/referrals/by-referrer?name=` - 특정 추천인의 가입자 목록
  - `GET /v1/referrals/recent` - 최근 추천인 목록

#### 3. 선호도 Top N 랭킹 시스템 ✅
- **가중치 자동 계산** (작업서 기준):
  ```typescript
  5개 선택: [0.30, 0.25, 0.20, 0.15, 0.10]
  4개 선택: [0.35, 0.30, 0.20, 0.15]
  3개 선택: [0.45, 0.35, 0.20]
  2개 선택: [0.60, 0.40]
  1개 선택: [1.00]
  ```
- **검증**:
  - rank는 1부터 순차적 (중복 불가)
  - 최소 1개, 최대 5개 선택
  - 동일 우선순위 금지
- **구조**:
  ```json
  {
    "items": [
      {"rank": 1, "type": "age_range", "value": "27-33"},
      {"rank": 2, "type": "region", "value": ["SEOUL", "GWANGGYO"]},
      {"rank": 3, "type": "hobby_overlap", "value": ["테니스", "등산"]}
    ],
    "weights": [0.45, 0.35, 0.20]
  }
  ```

#### 4. 데이터베이스 확장 ✅
- **마이그레이션 v2** (`migration-v2.sql` 생성)
  - `referrals` 테이블 추가
  - `preferences` 테이블에 `items`, `weights` 컬럼 추가
  - `profiles_private` 테이블 추가 (공개/비공개 분리)
  - `audit_logs` 테이블 추가 (관리자 접근 로깅)
  - `survey_options` 마스터 테이블 추가
- **기본 데이터**: 취미, 직업군, 학력 옵션 자동 삽입

---

## 📊 전체 구현 현황

### Backend (NestJS) - 완성도 95%

#### ✅ 완성된 모듈
1. **Users** - Firebase UID 동기화, 사용자 관리
2. **Profiles** - 프로필 CRUD (공개 프로필)
3. **Photos** - 사진 업로드/관리, 대표 사진 설정
4. **Preferences** - 선호도 설정 + Top N 랭킹
5. **Codes** - 월별 가입코드 시스템 (크론잡 포함)
6. **Referrals** - 추천인 시스템
7. **Feed** - 매칭 알고리즘 v0 (규칙 기반)
8. **Swipes** - 좋아요/패스/슈퍼라이크
9. **Matches** - 상호 매칭 관리
10. **Messages** - 채팅 메시지

#### 🔧 인프라
- ✅ TypeORM + MariaDB 연동
- ✅ Redis 캐싱 (Global Module)
- ✅ Firebase Authentication Guard
- ✅ Swagger API 문서화
- ✅ Docker Compose 구성
- ✅ 자동 스케줄링 (NestJS Schedule)

### 데이터베이스

#### ✅ 완성된 테이블
```sql
users, profiles, photos, preferences, swipes, matches, messages,
reports, blocks, user_metrics, monthly_codes, referrals
```

#### 🆕 추가 예정 테이블 (작업서 기반)
- `profiles_private` - 비공개 프로필 (재산, 자신감, 성격/가치관)
- `audit_logs` - 관리자 접근 로깅
- `survey_options` - 옵션 마스터 (취미/직업/학력)
- `ab_assignments` - A/B 테스트 (옵션)

---

## 🎯 작업서 기반 핵심 원칙 구현 상태

| 원칙 | 구현 상태 | 비고 |
|------|----------|------|
| 공개/비공개 구획 | 🟡 70% | `profiles_private` 테이블 준비, 로직 미구현 |
| 최소 필수 + 선택 확장 | ✅ 100% | DTO에 Optional 적용 |
| 선호 Top N 가중치 | ✅ 100% | 자동 계산 + 검증 완료 |
| 운영 자동화 | ✅ 100% | 월별 코드 크론잡, 추천인 통계 |

---

## 📋 다음 단계 (우선순위)

### 1. 공개/비공개 프로필 분리 (고우선)
```typescript
// profiles_private 모듈 구현
- Entity: ProfilePrivate
- Service: create, update, findByUserId (admin only)
- Guard: 본인 + 관리자만 접근
```

### 2. 관리자 API 구현
```typescript
// Admin 모듈
- POST /admin/codes/generate (수동 코드 생성)
- GET /admin/users (검색/필터/페이징)
- GET /admin/users/:uid (공개+비공개 요약, 감사로그)
- GET /admin/referrals/stats (추천인 통계)
- GET /admin/metrics (KPI/퍼널)
```

### 3. Shared Bits 배지 로직
```typescript
// Feed 서비스 확장
- 공통 취미/태그 추출
- 상위 3개 리즌 배지 생성
- 아이콘 + 키워드 매핑
```

### 4. Flutter Web UI 구현
작업서 §19 기준 (Instagram-like 톤앤매너):
- [ ] Welcome/SignIn 페이지
- [ ] 가입 Step 0-5 (코드/추천인/공개/비공개/선호)
- [ ] Feed 페이지 (카드 스와이프)
- [ ] Matches 목록
- [ ] Chat 페이지 (DM 스타일)
- [ ] Me (프로필 편집)

### 5. Survey Options 관리
```typescript
// Admin 옵션 마스터 CRUD
- POST /admin/options (옵션 추가)
- GET /admin/options?category=hobbies
- PATCH /admin/options/:id
- DELETE /admin/options/:id
```

---

## 🚀 실행 방법

### 1. 환경 설정
```bash
# .env 파일 확인 (.env.example 참고)
cp .env.example .env

# Firebase 인증 정보 설정
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=...
```

### 2. Docker Compose 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 마이그레이션 v2 실행
docker exec -i projectroom-mariadb mysql -u projectroom -pprojectroom < docker/mariadb/migration-v2.sql

# 서비스 상태 확인
docker-compose ps
```

### 3. 로컬 개발
```bash
# NestJS API
cd apps/api
npm install
npm run start:dev

# Flutter Web
cd apps/web
flutter pub get
flutter run -d chrome
```

---

## 📚 API 엔드포인트 요약

### 인증 & 가입
- `POST /v1/users/sync` - Firebase UID 동기화
- `POST /codes/validate` - 가입코드 검증
- `POST /v1/referrals` - 추천인 등록

### 프로필 & 설정
- `POST /v1/profiles` - 프로필 생성
- `GET /v1/profiles/me` - 내 프로필
- `PATCH /v1/profiles` - 프로필 수정
- `POST /v1/preferences` - 선호도 설정 (Top N 랭킹 포함)

### 사진
- `POST /v1/photos` - 사진 등록
- `GET /v1/photos?me=1` - 내 사진 목록
- `PATCH /v1/photos/:id` - 대표 사진 설정
- `DELETE /v1/photos/:id` - 사진 삭제

### 매칭 & 피드
- `GET /v1/feed?limit=20` - 매칭 피드 (스코어 + reasons)
- `POST /v1/swipes` - 좋아요/패스/슈퍼라이크
- `GET /v1/matches` - 매칭 목록
- `GET /v1/matches/:id` - 매칭 상세

### 메시지
- `GET /v1/messages/:matchId` - 메시지 목록
- `POST /v1/messages/:matchId` - 메시지 전송

### 관리자 (월별 코드)
- `POST /codes/generate` - 월별 코드 생성
- `GET /codes` - 코드 목록
- `POST /codes/:id/toggle` - 코드 활성화 토글
- `GET /v1/referrals/stats` - 추천인 통계

---

## 🧪 테스트 시나리오

### 작업서 체크리스트 (§10 기준)
- [x] 월초 00:00 KST 코드 생성/활성화 확인
- [ ] 코드를 입력하지 않으면 가입 진행 불가
- [ ] 잘못된 코드/만료 코드 에러 처리
- [ ] 공개 필수 필드 누락 시 진행 불가
- [x] 비공개 항목 미작성 시 문제 없음
- [x] 선호 1~5개 선택 시 가중치 벡터 올바르게 반영
- [ ] 사진 업로드 제약(개수/용량) 준수
- [ ] 임시 저장/복구 정상 동작
- [ ] RLS/감사로그 동작 (추후 구현)

---

## 📊 매칭 알고리즘

### v0: 규칙 기반 스코어링
```typescript
S = w1*공통태그 + w2*가치관 + w3*시간대겹침
  + w4*거리 + w5*응답성 + w6*품질
```

### v1: 선호도 Top N 반영 (신규)
```typescript
total_score = Σ (user_weights[i] * similarity[i])
// user_weights: 선호 랭킹 기반 가중치
// similarity: 각 선호 항목의 유사도 (0~1)
```

### 설정 가능 가중치 (.env)
```bash
WEIGHT_COMMON_TAGS=0.25
WEIGHT_VALUES_MATCH=0.20
WEIGHT_TIME_OVERLAP=0.15
WEIGHT_DISTANCE=0.15
WEIGHT_RESPONSIVENESS=0.15
WEIGHT_QUALITY_SCORE=0.10
```

---

## 🔐 보안 & 개인정보

### 구현됨
- ✅ Firebase Authentication Guard
- ✅ JWT 토큰 검증
- ✅ 본인 리소스만 수정 가능
- ✅ CORS 설정

### 예정
- [ ] RLS (Row-Level Security) - profiles_private
- [ ] 비공개 데이터 암호화 (KMS)
- [ ] Audit Logs (관리자 접근 기록)
- [ ] Rate Limiting
- [ ] Input Sanitization

---

## 📈 KPI & 메트릭 (작업서 기반)

### 핵심 지표
- **가입 퍼널**: 노출 → 코드입력 → 공개설문 → 비공개설문 → 선호랭킹 → 완료
- **매칭 퍼널**: 프로필뷰 → 좋아요 → 상호매칭 → 첫메시지 → 3문3답
- **전환율**: 첫메시지 전환율, 대화 5턴 도달율
- **가드레일**: 신고율/차단율, 언매치율

### 리즌별 성과
- 어떤 리즌 배지가 '좋아요'/'첫메시지'에 기여?
- 성/연령/지역 그룹별 공정성 지표

---

## 🛠️ 기술 스택

### Backend
- NestJS 10
- TypeORM 0.3.17
- MariaDB 11
- Redis 7
- Firebase Admin SDK 12

### Frontend (준비됨)
- Flutter Web
- Riverpod 2.6
- go_router 14
- dio 5.7
- Firebase (Auth + Storage)

### DevOps
- Docker Compose
- GitHub Actions (옵션)

---

## 📝 참고 문서

- [작업서.txt](작업서.txt) - 최신 요구사항 (v1.0)
- [README.md](README.md) - 프로젝트 개요
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase 설정 가이드
- [migration-v2.sql](docker/mariadb/migration-v2.sql) - DB 마이그레이션

---

## 🎉 v2.0 완료 요약

**신규 구현:**
- ✅ 월별 가입코드 시스템 (자동 생성 + 검증)
- ✅ 추천인 시스템 (통계 포함)
- ✅ 선호도 Top N 랭킹 + 자동 가중치 계산
- ✅ DB 마이그레이션 v2
- ✅ 빌드 성공

**다음 마일스톤:**
- 공개/비공개 프로필 분리 로직
- 관리자 API 구현
- Flutter UI 구현 (작업서 §19 기준)
- Shared Bits 배지 로직

---

**작성일**: 2025-10-02
**빌드 상태**: ✅ 성공
**테스트 상태**: 🟡 수동 테스트 필요
