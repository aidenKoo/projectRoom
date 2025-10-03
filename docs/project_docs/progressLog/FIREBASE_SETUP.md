# Firebase 설정 가이드 요약

이 문서는 NestJS 백엔드와 Flutter Web 클라이언트가 Firebase를
사용하는 방법을 정리합니다. 원본 문서는 단계별 스크린샷과 자세한
설명을 포함하고 있으므로, 여기서는 핵심 단계만 정리합니다【683363243463849†L1-L18】.

## Firebase 프로젝트 생성

1. Firebase Console에서 새 프로젝트를 생성하고 웹 앱을 추가합니다【683363243463849†L3-L17】.
2. Flutter Web 클라이언트에서는 `firebase_options.example.dart` 파일을
   복사하여 `firebase_options.dart`로 만들고, Console에서 발급받은
   `apiKey`, `appId`, `projectId`, `authDomain`, `storageBucket` 등을
   설정합니다【683363243463849†L20-L50】.

## NestJS 백엔드 설정

1. Firebase 서비스 계정을 생성하여 JSON 키를 다운로드합니다【683363243463849†L55-L65】.
2. `.env` 파일에 `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`,
   `FIREBASE_CLIENT_EMAIL`을 설정합니다【683363243463849†L66-L77】.
3. NestJS 코드에서 Firebase Admin SDK를 통해 ID 토큰 검증과 스토리지
   액세스를 수행합니다.

## Firebase 서비스 활성화

1. **Authentication**: 이메일/비밀번호와 Google 로그인 방법을
   활성화하고 `localhost`를 승인된 도메인에 추가합니다【683363243463849†L81-L90】.
2. **Cloud Storage**: 개발 초기에는 테스트 모드를 사용하고,
   프로덕션에서는 적절한 보안 규칙을 설정합니다【683363243463849†L91-L119】.

## Flutter 개발용 테스트

Flutter 앱을 실행(`flutter run -d web-server --web-port 5000`)하고
Firebase 인증 플로우를 테스트합니다【683363243463849†L122-L134】. NestJS API를
테스트하려면 브라우저에서 획득한 ID 토큰을 Authorization 헤더로 전송합니다【683363243463849†L139-L149】.

## 보안 주의사항

Firebase 비밀 키와 .env 파일, Service Account JSON 파일은 절대
버전관리 시스템에 커밋하지 않아야 합니다【683363243463849†L152-L167】. Storage 규칙을
강화하고 API 키에 도메인 제한을 적용하는 등, 프로덕션 환경에서는
추가적인 보안 조치를 취해야 합니다【683363243463849†L170-L174】.