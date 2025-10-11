# Social Login Setup Guide

## Overview

소셜 로그인(Google, Apple)이 Supabase Auth를 통해 구성되어 있습니다. 클라이언트에서 Supabase Auth SDK를 사용하여 로그인하고, 백엔드는 Firebase Auth Guard로 JWT 토큰을 검증합니다.

## Architecture

```
Client App
  ↓ (OAuth Flow)
Supabase Auth ← Google/Apple OAuth
  ↓ (JWT Token)
Backend API (Firebase Auth Guard)
  ↓
Database (User Sync)
```

---

## 1. Google OAuth Setup

### Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** → **Credentials** 이동
4. **Create Credentials** → **OAuth 2.0 Client ID** 선택

### OAuth Consent Screen 구성

- Application type: External
- Application name: ProjectRoom
- User support email: your-email@example.com
- Developer contact: your-email@example.com
- Scopes: `email`, `profile`, `openid`

### OAuth 2.0 Client ID 생성

**Application type:** Web application

**Authorized JavaScript origins:**
```
https://your-project.supabase.co
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://your-project.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

### 환경 변수 설정

생성된 Client ID와 Client Secret을 `.env`에 추가:

```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

---

## 2. Apple OAuth Setup

### Apple Developer Account 설정

1. [Apple Developer](https://developer.apple.com/) 로그인
2. **Certificates, Identifiers & Profiles** 이동
3. **Identifiers** → **App IDs** 선택

### Service ID 생성

1. **Identifiers** → **+** 버튼 클릭
2. **Services IDs** 선택
3. Description: ProjectRoom
4. Identifier: `com.yourapp.service`
5. **Sign in with Apple** 체크
6. **Configure** 클릭

### Return URLs 설정

**Primary App ID:** 앱의 Bundle ID 선택

**Website URLs:**
- Domains: `your-project.supabase.co`
- Return URLs: `https://your-project.supabase.co/auth/v1/callback`

**로컬 개발:**
- Domains: `localhost`
- Return URLs: `http://localhost:54321/auth/v1/callback`

### Key 생성

1. **Keys** → **+** 버튼 클릭
2. Key Name: ProjectRoom Sign In Key
3. **Sign in with Apple** 체크
4. Primary App ID 선택
5. 키 다운로드 (`.p8` 파일)

⚠️ **중요:** 키는 한 번만 다운로드 가능하므로 안전하게 보관

### Client Secret 생성

Apple은 Client Secret을 JWT 형태로 생성해야 합니다:

```bash
npm install -g jsonwebtoken
```

```javascript
// generate-apple-secret.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('AuthKey_XXXXXXXXXX.p8', 'utf8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: 'YOUR_TEAM_ID',
  subject: 'com.yourapp.service',
  keyid: 'YOUR_KEY_ID'
});

console.log(token);
```

실행:
```bash
node generate-apple-secret.js
```

### 환경 변수 설정

```bash
APPLE_CLIENT_ID=com.yourapp.service
APPLE_CLIENT_SECRET=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Supabase Configuration

### Dashboard 설정

1. [Supabase Dashboard](https://app.supabase.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 이동

### Google Provider 활성화

- **Google enabled** 체크
- Client ID 입력
- Client Secret 입력
- **Save** 클릭

### Apple Provider 활성화

- **Apple enabled** 체크
- Client ID (Services ID) 입력
- Client Secret (생성한 JWT) 입력
- **Save** 클릭

### Local Development (config.toml)

로컬 개발 환경은 `supabase/config.toml`에 이미 설정되어 있습니다:

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"

[auth.external.apple]
enabled = true
client_id = "env(APPLE_CLIENT_ID)"
secret = "env(APPLE_CLIENT_SECRET)"
```

---

## 4. Client Implementation

### Web (React)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Google Login
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Apple Login
async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// Get session after redirect
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token
```

### Mobile (React Native)

```typescript
import { supabase } from './lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

WebBrowser.maybeCompleteAuthSession()

const redirectUrl = Linking.createURL('auth/callback')

// Google Login
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true
    }
  })

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    )

    if (result.type === 'success') {
      const url = Linking.parse(result.url)
      const access_token = url.queryParams?.access_token
      const refresh_token = url.queryParams?.refresh_token

      await supabase.auth.setSession({
        access_token,
        refresh_token
      })
    }
  }
}
```

### Backend User Sync

로그인 후 백엔드로 사용자 동기화:

```typescript
// After successful OAuth login
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  // Sync user to backend
  await fetch('https://api.yourapp.com/v1/users/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: session.user.email,
      displayName: session.user.user_metadata.full_name,
      photoUrl: session.user.user_metadata.avatar_url,
      provider: session.user.app_metadata.provider
    })
  })
}
```

---

## 5. Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Set environment variables
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-secret"
export APPLE_CLIENT_ID="com.yourapp.service"
export APPLE_CLIENT_SECRET="your-jwt-secret"

# Test OAuth flow
open http://localhost:54321/auth/v1/authorize?provider=google
```

### Production Testing

1. Deploy Supabase configuration
2. Update OAuth provider redirect URLs to production URLs
3. Test full OAuth flow in production environment

---

## 6. Security Considerations

### Token Storage

- ✅ **DO:** Store tokens in httpOnly cookies or secure storage
- ❌ **DON'T:** Store tokens in localStorage on web

### PKCE Flow

Supabase Auth automatically uses PKCE (Proof Key for Code Exchange) for enhanced security.

### Token Refresh

```typescript
// Auto-refresh setup
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session)
    // Update backend if needed
  }
})
```

### Rate Limiting

- Google: 10,000 requests/day (free tier)
- Apple: 무제한 (실질적으로 제한 없음)

---

## 7. Troubleshooting

### Error: redirect_uri_mismatch

✅ **Solution:** Google/Apple Console의 Redirect URI가 Supabase callback URL과 정확히 일치하는지 확인

### Error: invalid_client

✅ **Solution:** Client ID/Secret이 올바른지 확인, 특히 Apple의 경우 JWT가 만료되지 않았는지 확인

### User not syncing to backend

✅ **Solution:**
1. JWT 토큰이 올바르게 전달되는지 확인
2. Firebase Auth Guard가 Supabase JWT를 검증하도록 설정
3. `syncUser` 엔드포인트 로그 확인

### Apple login works on iOS but not web

✅ **Solution:** Apple Service ID에 웹 도메인이 등록되어 있는지 확인

---

## 8. Migration from Firebase Auth

현재 Firebase Auth를 사용 중이므로 단계적 마이그레이션 권장:

### Phase 1: Dual Auth Support
- Firebase Auth 유지 (기존 사용자)
- Supabase Auth 추가 (신규 소셜 로그인)

### Phase 2: User Migration
- 기존 Firebase 사용자를 Supabase로 마이그레이션
- Firebase Admin SDK로 사용자 내보내기
- Supabase Admin API로 가져오기

### Phase 3: Firebase Deprecation
- Firebase Auth 비활성화
- Supabase Auth로 완전 전환

---

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Supabase Auth with React](https://supabase.com/docs/guides/auth/auth-helpers/react)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
