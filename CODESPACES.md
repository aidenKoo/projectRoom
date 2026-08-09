# 🚀 GitHub Codespaces로 Dating App 실행하기

이 프로젝트는 GitHub Codespaces에서 바로 실행할 수 있도록 완전히 구성되어 있습니다.

## ⚡ 빠른 시작

### 1. Codespace 생성
1. GitHub 리포지토리에서 **Code** 버튼 클릭
2. **Codespaces** 탭 선택
3. **Create codespace on main** 클릭
4. 자동으로 환경이 설정됩니다 (약 3-5분 소요)

### 2. 설정 완료 확인
Codespace가 생성되면 자동으로 다음이 설치됩니다:
- ✅ Flutter SDK (stable)
- ✅ Dart SDK
- ✅ Node.js 18.x
- ✅ Firebase CLI
- ✅ FlutterFire CLI
- ✅ Chrome (headless)
- ✅ VS Code 확장 프로그램들

### 3. Firebase 설정
```bash
# Firebase 로그인
firebase login --no-localhost

# Firebase 프로젝트 설정
flutterfire configure
```

### 4. 앱 실행
```bash
# 터미널 1: Firebase 에뮬레이터 시작
firebase emulators:start

# 터미널 2: Flutter 앱 실행
flutter run -d web
```

## 🔗 포트 포워딩

Codespaces는 다음 포트들을 자동으로 포워딩합니다:
- **3000**: Flutter 개발 서버
- **4000**: Firebase 에뮬레이터 UI
- **5000**: Firebase 호스팅
- **5001**: Firebase Functions
- **8080**: Firestore 에뮬레이터
- **9099**: Firebase Auth 에뮬레이터
- **9199**: Firebase Storage 에뮬레이터

## 🛠️ 개발 환경

### VS Code 확장 프로그램
자동으로 설치되는 확장 프로그램들:
- **Dart-Code.flutter**: Flutter 개발
- **Dart-Code.dart-code**: Dart 언어 지원
- **Continue.continue**: AI 코딩 어시스턴트
- **Firebase.firebase-vscode**: Firebase 통합
- **ms-vscode.vscode-typescript-next**: TypeScript 지원

### 터미널 명령어
유용한 개발 명령어들:
```bash
# Flutter 상태 확인
flutter doctor

# 의존성 재설치
flutter clean && flutter pub get

# 웹용 빌드
flutter build web

# Functions 빌드
cd functions && npm run build

# Firebase 배포
firebase deploy
```

## 🔥 Firebase 설정

### 1. 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 새 프로젝트 생성
3. Authentication, Firestore, Storage, Functions 활성화

### 2. 로컬 설정
```bash
# Firebase 프로젝트 연결
firebase use --add

# Flutter용 Firebase 설정 생성
flutterfire configure

# 생성된 firebase_options.dart 확인
```

### 3. 에뮬레이터 설정
```bash
# 에뮬레이터 시작 (UI 포함)
firebase emulators:start

# 특정 서비스만 시작
firebase emulators:start --only firestore,auth
```

## 🎨 개발 팁

### Hot Reload
- **r**: Hot reload
- **R**: Hot restart
- **q**: 종료

### 디버깅
```bash
# Flutter 로그 확인
flutter logs

# Chrome DevTools 열기
flutter run -d web --web-port=3000
```

### AI 코딩 (Continue)
1. `Ctrl+I` (또는 `Cmd+I`) 눌러서 Continue 활성화
2. 코드 질문이나 수정 요청
3. 자동으로 Flutter/Firebase 관련 도움 제공

## 🚨 문제 해결

### Flutter Doctor 오류
```bash
flutter doctor
flutter config --enable-web
```

### Firebase 로그인 문제
```bash
firebase logout
firebase login --no-localhost
```

### 포트 충돌
```bash
# 다른 포트로 실행
flutter run -d web --web-port=3001
```

### 의존성 문제
```bash
flutter clean
flutter pub get
cd functions && npm ci
```

## 🌐 배포

### Firebase 호스팅
```bash
flutter build web
firebase deploy --only hosting
```

### Cloud Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 전체 배포
```bash
flutter build web
cd functions && npm run build && cd ..
firebase deploy
```

## 📝 추가 정보

- **개발 문서**: [README.md](./README.md)
- **Firebase 문서**: [Firebase Docs](https://firebase.google.com/docs)
- **Flutter 문서**: [Flutter Docs](https://flutter.dev/docs)

---

**💡 팁**: Codespace는 최대 30일간 유지되므로, 정기적으로 코드를 커밋하세요!