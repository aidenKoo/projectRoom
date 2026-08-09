# 🚀 빠른 시작 가이드

## 🔧 로컬 환경에서 실행하기

### ⚡ 빠른 데모 실행 (Firebase 없이)
```bash
# Firebase 버전 문제 해결 + 데모 실행
./run_demo.sh

# 또는 수동으로
flutter run -t lib/main_simple.dart -d chrome --web-port=3000
```

### 🔥 전체 Firebase 앱 실행

#### 1단계: Firebase 버전 문제 해결
```bash
./fix_firebase_versions.sh
```

#### 2단계: Firebase 에뮬레이터 시작 (필요한 경우)
```bash
firebase emulators:start
```

#### 3단계: Flutter 앱 실행
```bash
# Firebase 포함 전체 앱
flutter run -d chrome --web-port=3000

# 또는 개발 모드 (에뮬레이터 연결)
flutter run -t lib/main_dev.dart -d chrome --web-port=3000
```

---

## ☁️ GitHub Codespaces에서 실행하기

### 1단계: Codespace 생성
1. GitHub 리포지토리에서 **Code** → **Codespaces** → **Create codespace**
2. 자동으로 환경 설정 (3-5분 소요)

### 2단계: 앱 실행
```bash
# Firebase 에뮬레이터 시작 (터미널 1)
firebase emulators:start

# Flutter 앱 실행 (터미널 2)
flutter run -d web --web-port=3000
```

### 접속 주소
- **앱**: `https://your-codespace-3000.preview.app.github.dev`
- **Firebase UI**: `https://your-codespace-4000.preview.app.github.dev`

---

## 📱 주요 기능 테스트

### 1. 회원가입
1. 앱 실행 후 이메일로 회원가입
2. 4단계 설문조사 완료:
   - 기본 정보 (나이, 직업, 연애 목표)
   - 취미/관심사 선택
   - Big Five 성격 평가
   - 프로필 사진 업로드

### 2. 매칭 확인
1. 설문 완료 후 매칭 화면으로 이동
2. 호환성 점수별로 정렬된 추천 목록 확인
3. 각 프로필 카드에서 점수와 공통 관심사 확인

### 3. 알림 테스트
1. 우상단 알림 아이콘 클릭
2. 80% 이상 매칭 시 푸시 알림 수신 확인

---

## 🛠️ 개발 도구

### VS Code 확장 프로그램
자동 설치되는 확장 프로그램들:
- **Flutter & Dart**: Flutter 개발 지원
- **Continue**: AI 코딩 어시스턴트
- **Firebase**: Firebase 통합 도구

### 유용한 명령어
```bash
# Flutter 상태 확인
flutter doctor

# 핫 리로드 (앱 실행 중)
r

# 의존성 재설치
flutter clean && flutter pub get

# Functions 빌드
cd functions && npm run build
```

---

## 🔥 Firebase 설정 (선택사항)

실제 Firebase 프로젝트 연결:

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 새 프로젝트 생성
3. Authentication, Firestore, Storage 활성화

### 2. 프로젝트 연결
```bash
# Firebase 로그인 (Codespaces에서)
firebase login --no-localhost

# FlutterFire 설정
flutterfire configure
```

### 3. 실제 데이터베이스 사용
- `lib/main.dart` 사용 (실제 Firebase)
- `lib/main_dev.dart` 사용 (에뮬레이터)

---

## 🚨 문제 해결

### Flutter 실행 오류
```bash
flutter clean
flutter pub get
flutter doctor
```

### Firebase 연결 오류
```bash
firebase logout
firebase login --no-localhost
firebase emulators:start
```

### 포트 충돌
```bash
# 다른 포트 사용
flutter run -d web --web-port=3001
```

### Codespaces 포트 포워딩
1. VS Code 하단 **PORTS** 탭 클릭
2. 필요한 포트(3000, 4000, 8080 등) 확인
3. 자동으로 공개 URL 생성됨

---

## 🎯 다음 단계

1. **UI 커스터마이징**: 색상, 폰트, 레이아웃 수정
2. **매칭 알고리즘 개선**: 가중치 조정, 새 요소 추가
3. **채팅 기능 추가**: 매칭된 사용자와 대화
4. **실시간 알림**: FCM 푸시 알림 구현
5. **앱 배포**: Firebase Hosting, Play Store, App Store

---

**💡 팁**: Continue 확장 프로그램(`Ctrl+I`)을 사용해서 코드 질문이나 수정을 요청할 수 있습니다!