#!/usr/bin/env bash
set -euo pipefail

# 한 번만 실행되어야 하는 초기 부트스트랩
ME="$(id -un)"
GRP="$(id -gn)"
WS="/workspaces/projectRoom"
FLUTTER_HOME="${FLUTTER_HOME:-/opt/flutter}"
PUB_CACHE="${PUB_CACHE:-/home/vscode/.pub-cache}"

# 안전한 퍼미션
sudo chown -R "$ME":"$GRP" "$FLUTTER_HOME" "$PUB_CACHE" "$WS" || true

# npm 최신화(간혹 npx 버그 회피)
if command -v npm >/dev/null 2>&1; then
  npm i -g npm@latest || true
  # corepack 활성화(원하면 yarn/pnpm도 바로 사용 가능)
  corepack enable || true
fi

# Flutter 초기 캐시/툴세팅 (반복 실행 안전)
sudo -u "$ME" bash -lc "flutter precache --linux --no-android || true"
sudo -u "$ME" bash -lc "dart --disable-analytics || true"
sudo -u "$ME" bash -lc "flutter --disable-analytics || true"

# 프로젝트 폴더에 .dart_tool가 root로 남아있다면 제거
if [ -d "$WS/.dart_tool" ] && [ "$(stat -c %U "$WS/.dart_tool")" != "$ME" ]; then
  rm -rf "$WS/.dart_tool"
fi

# 빠른 체크
sudo -u "$ME" bash -lc "flutter --version && dart --version" || true
