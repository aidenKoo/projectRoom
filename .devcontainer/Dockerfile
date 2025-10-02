# 베이스: Codespaces 표준 Dev Container
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

ARG DEBIAN_FRONTEND=noninteractive
ARG FLUTTER_VERSION=3.24.0

# 1) 시스템 의존성 (Flutter/Dart/빌드/GTK + Supabase CLI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git unzip xz-utils zip build-essential \
    clang cmake ninja-build pkg-config libgtk-3-dev liblzma-dev \
    libstdc++-12-dev libglu1-mesa postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# 1-1) Install Supabase CLI
RUN curl -fsSL https://github.com/supabase/cli/releases/download/v1.200.3/supabase_1.200.3_linux_amd64.deb -o /tmp/supabase.deb \
 && dpkg -i /tmp/supabase.deb \
 && rm /tmp/supabase.deb

# 2) 환경변수
ENV FLUTTER_HOME=/opt/flutter \
    PATH=/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:${PATH} \
    PUB_CACHE=/home/vscode/.pub-cache

# 3) Flutter 설치 (root 권한으로 clone → 소유권 변경)
RUN git clone --depth 1 -b ${FLUTTER_VERSION} https://github.com/flutter/flutter.git ${FLUTTER_HOME} \
 && chown -R vscode:vscode ${FLUTTER_HOME}

# 4) vscode 사용자로 전환 후, 캐시/툴 체인 “미리” 준비
USER vscode
SHELL ["/bin/bash", "-lc"]

# 4-1) pub 캐시 디렉터리 준비
RUN mkdir -p "${PUB_CACHE}"

# 4-2) Flutter/Dart 최초 구동 + universal precache
#      (여기서 툴 체인 .dart_tool/.pub-cache 가 전부 vscode 소유로 생성됨)
RUN flutter --version \
 && dart --version \
 && flutter precache --universal

# 4-3) flutter_tools 의존성 선 설치 (문제의 pub upgrade를 빌드 타임에 끝내기)
RUN cd ${FLUTTER_HOME}/packages/flutter_tools && dart pub get

# 4-4) 진단 캐시까지 미리 채워두기 (실패해도 빌드 계속)
RUN flutter doctor -v || true

# 4-5) 전역 NPM 도구 설치 (사용자 요청)
RUN su - vscode -c "npm install -g @anthropic-ai/claude-code @google/gemini-cli pnpm firebase-tools"

# 5) 안전: 다시 PATH 보장
ENV PATH=/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:${PATH}

# 6) 작업 디렉토리 (Codespaces가 여기에 워크스페이스를 마운트)
WORKDIR /workspaces/projectRoom
