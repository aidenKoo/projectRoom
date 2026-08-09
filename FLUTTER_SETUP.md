# 🔧 Flutter Doctor 문제 해결 가이드

Flutter Doctor에서 발견된 문제들을 해결하는 방법입니다.

## 🚀 빠른 해결 (웹 개발만 필요한 경우)

웹 개발만 하신다면 이 스크립트 하나로 충분합니다:

```bash
./flutter_web_only_setup.sh
```

이 스크립트는 다음을 자동으로 설정합니다:
- ✅ Flutter PATH 설정
- ✅ Chrome/Chromium 설치 및 설정
- ✅ Flutter 웹 지원 활성화
- ✅ 프로젝트 의존성 설치

---

## 🔍 개별 문제 해결

### 1. Flutter PATH 문제 ⚠️
```
! The flutter binary is not on your path.
! The dart binary is not on your path.
```

**해결방법:**
```bash
./fix_flutter_path.sh
source ~/.zshrc  # 또는 ~/.bashrc
```

### 2. Chrome 실행 파일 문제 ❌
```
Cannot find Chrome executable
```

**해결방법:**
```bash
./install_chrome.sh
```

또는 수동 설치:
- [Chrome 다운로드](https://www.google.com/chrome/)
- Homebrew: `brew install --cask google-chrome`

### 3. CocoaPods 문제 (iOS 개발 시만) ❌
```
CocoaPods not installed
```

**해결방법:**
```bash
./install_cocoapods.sh
```

---

## 📱 플랫폼별 설정

### 🌐 웹만 개발 (권장)
```bash
# 웹 전용 설정
./flutter_web_only_setup.sh

# 앱 실행
flutter run -d chrome --web-port=3000
```

### 📱 iOS 개발 (macOS만)
```bash
# Xcode 설치 (App Store에서)
# CocoaPods 설치
./install_cocoapods.sh

# iOS 실행
flutter run -d ios
```

### 🤖 Android 개발
```bash
# Android Studio 설치
# https://developer.android.com/studio

# Android SDK 설정 후
flutter run -d android
```

---

## 🔄 설정 후 확인

```bash
# 터미널 새로 열기 또는
source ~/.zshrc

# Flutter 상태 확인
flutter doctor -v

# 웹 실행 테스트
flutter run -d chrome --web-port=3000
```

---

## ✅ 성공적인 웹 개발 환경

Flutter Doctor 결과에서 다음만 ✅ 표시되면 웹 개발 가능:
- ✅ Flutter (PATH 포함)
- ✅ Chrome - develop for the web
- ✅ VS Code
- ✅ Connected device (Chrome/macOS)
- ✅ Network resources

다음은 웹 개발에 불필요 (❌ 무시 가능):
- ❌ Android toolchain
- ❌ Xcode
- ❌ Android Studio

---

## 🚨 문제 해결

### PATH가 적용되지 않는 경우
```bash
# 현재 셸 확인
echo $SHELL

# zsh 사용 시
echo 'export PATH="$PATH:/Users/aidenkoo/git/projectRoom/flutter/bin"' >> ~/.zshrc
source ~/.zshrc

# bash 사용 시
echo 'export PATH="$PATH:/Users/aidenkoo/git/projectRoom/flutter/bin"' >> ~/.bashrc
source ~/.bashrc
```

### Chrome 환경변수 설정
```bash
# Chrome 경로 찾기
find /Applications -name "Google Chrome" 2>/dev/null

# 환경변수 설정
export CHROME_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### 권한 오류
```bash
# 스크립트 실행 권한 부여
chmod +x *.sh

# Flutter 디렉토리 권한 확인
ls -la /Users/aidenkoo/git/projectRoom/flutter/bin/flutter
```

---

## 🎯 최종 목표

웹 앱 실행 성공:
```bash
flutter run -d chrome --web-port=3000
```

브라우저에서 `http://localhost:3000`으로 Dating App 확인! 🎉