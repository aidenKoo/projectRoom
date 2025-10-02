#!/usr/bin/env bash
set -euo pipefail

# 현재 사용자
ME="$(id -un)"
GRP="$(id -gn)"

# 경로
FLUTTER_HOME="${FLUTTER_HOME:-/opt/flutter}"
PUB_CACHE="${PUB_CACHE:-/home/vscode/.pub-cache}"
WS="/workspaces/projectRoom"

echo "[fix-perms] Fixing ownership and permissions..."
sudo chown -R "$ME":"$GRP" "$FLUTTER_HOME" "$PUB_CACHE" "$WS" 2>/dev/null || true
sudo find "$FLUTTER_HOME" "$PUB_CACHE" "$WS" -type d -exec chmod u+rwx,g+rx {} \; 2>/dev/null || true
sudo find "$FLUTTER_HOME" "$PUB_CACHE" "$WS" -type f -exec chmod u+rw,g+r {} \; 2>/dev/null || true

# .dart_tool 잔재가 root면 삭제 (SDK/워크스페이스 둘 다)
for p in "$FLUTTER_HOME/packages/flutter_tools" "$WS"; do
  if [ -d "$p/.dart_tool" ] && [ "$(stat -c %U "$p/.dart_tool")" != "$ME" ]; then
    echo "[fix-perms] Removing stale $p/.dart_tool due to wrong owner"
    rm -rf "$p/.dart_tool"
  fi
done

# git safe.directory (Codespaces에서 소유자 바뀔 때 대비)
git config --global --add safe.directory "$WS" || true

# Node/NPM/Npx sanity (features/node로 설치됨)
echo "[fix-perms] Node/npm check..."
node -v || true
npm -v || true
npx -v || true

# Flutter 툴 의존성 체크 (사용자 권한으로)
echo "[fix-perms] Flutter tool bootstrap..."
sudo -u "$ME" bash -lc "cd \"$FLUTTER_HOME/packages/flutter_tools\" && dart pub get" || true

# 빠른 self test
echo "[fix-perms] Quick doctor..."
sudo -u "$ME" bash -lc "flutter --version && dart --version && flutter doctor -v" || true

echo "[fix-perms] Done."
