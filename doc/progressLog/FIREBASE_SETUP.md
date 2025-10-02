# Firebase 설정 가이드

## 🔥 Firebase 프로젝트 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com 방문
   - Google 계정으로 로그인

2. **새 프로젝트 생성**
   - "프로젝트 추가" 클릭
   - 프로젝트 이름 입력 (예: ProjectRoom)
   - Google Analytics 설정 (선택사항)

3. **웹 앱 추가**
   - 프로젝트 개요 > 웹 앱 추가 (</>)
   - 앱 닉네임 입력
   - "Firebase Hosting 설정" 체크박스는 선택사항

## 📋 클라이언트 설정 (Flutter Web)

### 1. Firebase 설정 파일 생성

```bash
cd /workspaces/projectRoom/apps/web/lib
cp firebase_options.example.dart firebase_options.dart
```

### 2. Firebase Console에서 설정값 복사

Firebase Console > 프로젝트 설정 > 일반 > SDK 설정 및 구성 섹션에서:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId` (선택)

### 3. firebase_options.dart 파일 수정

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'AIzaSy...복사한_값',
  appId: '1:123456789:web:abc...복사한_값',
  messagingSenderId: '복사한_값',
  projectId: '복사한_값',
  authDomain: '복사한_값.firebaseapp.com',
  storageBucket: '복사한_값.appspot.com',
  measurementId: 'G-복사한_값', // 선택사항
);
```

## 🔐 백엔드 설정 (NestJS)

### 1. Service Account 생성

Firebase Console > 프로젝트 설정 > 서비스 계정 탭:

1. "새 비공개 키 생성" 클릭
2. JSON 파일 다운로드
3. 파일 열어서 다음 정보 확인:
   - `project_id`
   - `private_key`
   - `client_email`

### 2. .env 파일 설정

`/workspaces/projectRoom/.env` 파일에 추가:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n복사한_키\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**중요:** `FIREBASE_PRIVATE_KEY`는 큰따옴표로 감싸고, `\n`을 실제 줄바꿈이 아닌 문자열로 입력해야 합니다.

## 🔧 Firebase 서비스 활성화

### 1. Authentication 설정

Firebase Console > Authentication:

1. "시작하기" 클릭
2. 로그인 방법 탭에서 활성화:
   - ✅ 이메일/비밀번호
   - ✅ Google
3. 승인된 도메인에 `localhost` 추가 확인

### 2. Cloud Storage 설정

Firebase Console > Storage:

1. "시작하기" 클릭
2. 보안 규칙 선택:
   - 테스트 모드로 시작 (개발 중)
   - 프로덕션 규칙은 나중에 설정

3. Storage 규칙 설정 (`storage.rules`):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 사용자 프로필 사진
    match /user_photos/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // 썸네일
    match /thumbnails/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 테스트

### 1. Flutter 앱 실행

```bash
cd /workspaces/projectRoom/apps/web
flutter run -d web-server --web-port 5000
```

http://localhost:5000 접속

### 2. 회원가입 테스트

1. Welcome 페이지에서 "Sign In" 클릭
2. 이메일/비밀번호로 회원가입
3. Firebase Console > Authentication > Users에서 확인

### 3. NestJS API 테스트

```bash
# ID Token 가져오기 (브라우저 개발자 도구 Console에서)
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log(token);

# API 테스트
curl -X POST http://localhost:3000/v1/users/sync \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## 🔒 보안 주의사항

1. **절대 커밋하지 말 것:**
   - `firebase_options.dart` (실제 키 포함)
   - `.env` (백엔드 키 포함)
   - Firebase Service Account JSON 파일

2. **.gitignore 확인:**
   ```
   # Firebase
   **/firebase_options.dart
   !**/firebase_options.example.dart

   # Environment
   .env
   .env.local
   ```

3. **프로덕션 배포 시:**
   - Storage 규칙 강화
   - API 키 도메인 제한
   - Rate limiting 설정

## 📚 참고 문서

- [Firebase Console](https://console.firebase.google.com)
- [FlutterFire 공식 문서](https://firebase.flutter.dev)
- [Firebase Admin SDK for Node.js](https://firebase.google.com/docs/admin/setup)
