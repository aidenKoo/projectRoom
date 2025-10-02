#!/usr/bin/env bash
set -euo pipefail

echo "[bootstrap] start"

REQUIRED=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE)
for k in "${REQUIRED[@]}"; do
  if [[ -z "${!k-}" ]]; then
    echo "[bootstrap] ERROR: env $k is empty or not set in Codespaces Secrets." >&2
    exit 1
  fi
done

# 1) Flutter용 dart-define 파일 (Anon만)
mkdir -p .secrets
cat > .secrets/dart_defines.json <<EOF
{
  "SUPABASE_URL": "${SUPABASE_URL}",
  "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
}
EOF
chmod 600 .secrets/dart_defines.json
echo "[bootstrap] wrote .secrets/dart_defines.json"

# 2) Supabase CLI/Functions용 .env (Service Role 포함)
mkdir -p supabase functions
cat > supabase/.env <<EOF
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE=${SUPABASE_SERVICE_ROLE}
EOF
chmod 600 supabase/.env
echo "[bootstrap] wrote supabase/.env"

# (선택) functions 공통 .env
mkdir -p supabase/functions
cp -f supabase/.env supabase/functions/.env || true
chmod 600 supabase/functions/.env

# 3) Flutter 의존성
flutter --version >/dev/null 2>&1 || { echo "[bootstrap] flutter not found"; exit 1; }
flutter pub get
echo "[bootstrap] flutter pub get done"

echo "[bootstrap] OK"
