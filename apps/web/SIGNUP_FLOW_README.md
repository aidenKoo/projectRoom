# 가입 및 설문 플로우 구현 완료

## 개요

작업서1.1.txt의 **[작업 2] 사용자 가입 및 설문 플로우 개발 (프론트엔드)**가 완료되었습니다.

## 구현된 기능

### 1. 디자인 시스템 컴포넌트 (§19)

#### 새로 추가된 위젯
- **`MultiSelectChip`** (`lib/core/widgets/multi_select_chip.dart`)
  - MBTI, 취미 등 다중 선택
  - 최대 선택 개수 제한
  - 선택/비선택 상태 시각화

- **`LabeledSlider`** (`lib/core/widgets/labeled_slider.dart`)
  - 외모/몸매 자신감 평가 (1~5점)
  - 최소/최대 라벨 표시
  - 현재 값 강조

- **`PhotoUploadGrid`** (`lib/core/widgets/photo_upload_grid.dart`)
  - 1~5장 사진 업로드
  - 대표 사진 표시
  - 10MB/장 제한
  - 미리보기 및 삭제

### 2. 로그인/가입 플로우 (§2.1)

#### 개선된 로그인 화면
**파일**: `lib/features/auth/presentation/screens/improved_login_screen.dart`

- Firebase Authentication 완전 통합
- 이메일/비밀번호 로그인
- 에러 처리 (잘못된 계정, 비밀번호 등)
- 비밀번호 표시/숨김 토글
- 소셜 로그인 UI (준비중)

#### 3단계 가입 플로우
**파일**: `lib/pages/signup_flow/complete_signup_flow.dart`

**Step 1**: 이메일/비밀번호 입력
- 이메일 유효성 검증
- 비밀번호 최소 6자
- 비밀번호 확인 일치 검증

**Step 2**: 추천인 입력 (선택)
- 자유 텍스트 입력
- 건너뛰기 가능

**Step 3**: 월별 가입 코드 (필수)
- API 실시간 검증
- 유효하지 않은 코드 에러 처리

### 3. 통합 리서치 화면 (§2.2)

**파일**: `lib/pages/signup_flow/integrated_research_screen.dart`

- 3개 탭: 공개/비공개/선호도
- 진행률 표시 (실시간 계산)
- 각 탭별 설명 배너
- 자동 임시 저장 (Draft Provider)
- 하단 고정 액션 바

### 4. 공개 프로필 폼 (§3.2)

**파일**: `lib/pages/signup_flow/public_profile_form.dart`

**필수 입력 항목**:
- 이름 (1~20자)
- 나이 (19~60)
- 키 (130~220cm)
- 사진 (1~5장, 최소 1장)
- 직업 (최대 30자)
- 학력 (드롭다운)
- MBTI (1~2개)
- 취미 (1~5개)
- 지역
- 자취 여부

**선택 항목**:
- 자기소개 (최대 300자)

### 5. 비공개 프로필 폼 (§3.3)

**파일**: `lib/pages/signup_flow/private_profile_form.dart`

**"자신 있는 부분만" 작성 (모두 선택)**:
- 재산 수준 (중간/꽤 많음/많음)
- 외모 자신감 (1~5, 기본 3)
- 몸매 자신감 (1~5, 기본 3)
- 성격 설문 (5문항)
  - 내향/외향, 즉흥적/계획적, 갈등 대처, 감정 표현, 의사결정
- 가치관 설문 (5문항)
  - 가족, 커리어, 종교, 라이프스타일, 미래 계획

### 6. 선호도 랭킹 (§3.4)

**파일**: `lib/pages/signup_flow/preferences_form.dart`

**기능**:
- 10개 카테고리 중 1~5개 선택
- 드래그 앤 드롭으로 순위 변경
- 가중치 자동 계산 및 표시
  - 1개: [1.00]
  - 2개: [0.60, 0.40]
  - 3개: [0.45, 0.35, 0.20]
  - 4개: [0.35, 0.30, 0.20, 0.15]
  - 5개: [0.30, 0.25, 0.20, 0.15, 0.10]

**선택 가능 카테고리**:
- 나이대, 키 범위, 지역, 직업군, 학력
- MBTI 상성, 취미 호환, 라이프스타일
- 성격 키워드, 가치관

### 7. API 연동

**파일**: `lib/services/api_service.dart`

**추가된 메서드**:
- `validateMonthlyCode()`: 가입 코드 검증
- `submitReferral()`: 추천인 제출
- `updatePreferences()`: 선호도 저장
- `getRecommendations()`: 추천 후보 조회
- `likeUser()`: 좋아요
- `skipUser()`: 스킵

## 프로젝트 구조

```
apps/web/lib/
├── core/
│   ├── theme/
│   │   └── app_theme.dart
│   └── widgets/
│       ├── primary_button.dart
│       ├── custom_text_field.dart
│       ├── multi_select_chip.dart           🆕
│       ├── labeled_slider.dart              🆕
│       └── photo_upload_grid.dart           🆕
├── features/
│   └── auth/
│       └── presentation/
│           └── screens/
│               └── improved_login_screen.dart  🆕
├── pages/
│   └── signup_flow/                         🆕
│       ├── complete_signup_flow.dart        🆕
│       ├── integrated_research_screen.dart  🆕
│       ├── public_profile_form.dart         🆕
│       ├── private_profile_form.dart        🆕
│       └── preferences_form.dart            🆕
├── providers/
│   └── draft_provider.dart                  (확장)
├── services/
│   └── api_service.dart                     (확장)
└── routes/
    └── app_router.dart                      (업데이트)
```

## 사용 방법

### 1. 가입 플로우 시작

```dart
context.go('/signup');
```

### 2. 리서치 화면으로 직접 이동

```dart
context.go('/research');
```

### 3. Draft Provider 사용

```dart
// 데이터 저장
ref.read(draftProvider.notifier).updateField('name', '홍길동');

// 여러 필드 한 번에 저장
ref.read(draftProvider.notifier).updateAllFields({
  'name': '홍길동',
  'age': 29,
  'height_cm': 176,
});

// 데이터 읽기
final draft = ref.read(draftProvider);
final name = draft['name'];

// 초기화
await ref.read(draftProvider.notifier).clearAll();
```

## 라우팅

```
/login                    → ImprovedLoginScreen
/signup                   → CompleteSignupFlow (3단계)
/research                 → IntegratedResearchScreen (탭 3개)
/feed                     → FeedPage (가입 완료 후)
```

## 데이터 흐름

1. **가입 단계** (`CompleteSignupFlow`)
   - Firebase Auth 계정 생성
   - 추천인 제출 (선택)
   - 가입 코드 검증

2. **리서치 단계** (`IntegratedResearchScreen`)
   - Draft Provider에 자동 저장
   - 각 탭에서 폼 작성
   - 마지막 탭에서 전체 제출

3. **API 제출**
   - 공개 프로필 → `/profiles`
   - 비공개 프로필 → `/profiles/private`
   - 선호도 → `/preferences`

4. **완료**
   - Draft 초기화
   - Feed 페이지로 이동

## 테스트 시나리오

### 가입 플로우
- [ ] 유효하지 않은 이메일로 가입 시도
- [ ] 비밀번호 6자 미만 입력
- [ ] 비밀번호 불일치
- [ ] 유효하지 않은 가입 코드
- [ ] 정상 가입 및 리서치 화면 이동

### 리서치 플로우
- [ ] 공개 프로필: 모든 필수 항목 입력
- [ ] 사진 1장 미만 업로드 시 에러
- [ ] MBTI 3개 이상 선택 시 제한
- [ ] 취미 6개 이상 선택 시 제한
- [ ] 비공개 프로필: 모든 항목 건너뛰기 가능
- [ ] 선호도: 6개 이상 선택 시 제한
- [ ] 선호도: 드래그 앤 드롭 순위 변경
- [ ] 탭 전환 시 데이터 유지
- [ ] "나중에 작성" 클릭 시 임시 저장
- [ ] 완료 버튼 클릭 시 API 제출 및 Feed 이동

## 알려진 제한사항

1. **사진 업로드**
   - Firebase Storage 업로드 로직 미완성
   - 현재는 로컬 메모리에만 저장
   - TODO: 실제 업로드 및 URL 저장

2. **소셜 로그인**
   - Google, Apple 로그인 UI만 구현
   - 실제 연동 미완성

3. **웹 브라우저 호환성**
   - image_picker 웹 지원 일부 제한
   - 일부 브라우저에서 이미지 선택 이슈 가능

## 다음 단계

1. **사진 업로드 완성**
   - Firebase Storage 업로드
   - 썸네일 생성
   - URL 저장

2. **소셜 로그인 구현**
   - Google Sign In
   - Apple Sign In

3. **유효성 검증 강화**
   - 더 세밀한 에러 처리
   - 엣지 케이스 처리

4. **UI/UX 폴리싱**
   - 애니메이션 개선
   - 반응형 디자인 최적화
   - 접근성 향상

## 참고 문서

- **개발서**: `/workspaces/projectRoom/doc/작업서1.1.txt`
- **개발 현황**: `/workspaces/projectRoom/doc/progressLog/DEVELOPMENT_STATUS_v9.md`
- **API 문서**: 작업서 §8 참조

---

**작성일**: 2025-10-03
**버전**: v9
**작성자**: Claude Code Assistant
