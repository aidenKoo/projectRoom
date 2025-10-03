# Supabase 개발 가이드 요약

본 문서는 Supabase를 활용한 개발 환경을 빠르게 구성하고
Claude API를 포함한 Edge Functions를 실행하는 방법을 요약합니다. 원본
문서는 도커 구성, 서비스 접속 정보, 마이그레이션, Edge Functions 사용법
등을 상세히 설명하고 있습니다【600149368786617†L0-L18】.

## 로컬 개발 환경

`docker-compose up -d` 명령으로 Supabase, Redis, MinIO, MailHog,
Metabase, Adminer 등 모든 서비스를 시작할 수 있습니다【600149368786617†L4-L18】.
Supabase Studio는 `http://localhost:3000`, API Gateway는
`http://localhost:8000`에서 접속합니다【600149368786617†L20-L33】.

## 프로젝트 구조와 마이그레이션

Supabase 디렉터리에는 CLI 설정(`config.toml`), API Gateway 라우팅
(`kong.yml`), 로그 설정(`vector.yml`), 데이터베이스 마이그레이션 SQL,
Edge Functions, 시드 데이터 등이 포함되어 있습니다【600149368786617†L49-L64】.
마이그레이션은 `supabase migration new`로 생성하고 `supabase db reset`
또는 `supabase db push` 명령으로 적용합니다【600149368786617†L80-L100】.

## 환경 변수와 기본 자격 증명

`.env.example` 파일을 복사하여 `.env`를 만들고 Supabase 익명 키와
서비스 롤 키를 설정합니다【600149368786617†L40-L76】. 로컬 개발용 키는
데모용으로만 사용하며 프로덕션에서는 Supabase에서 발급받은 키를 사용해야
합니다【600149368786617†L78-L79】.

## Edge Functions와 Claude 통합

작업서에서는 Claude API를 활용하는 Edge Function 3가지를 정의합니다:

1. **profile‑analyzer**: 사용자의 소개 글을 분석하여 요약과 태그를
   생성합니다【600149368786617†L184-L190】.
2. **content‑moderator**: 메시지와 콘텐츠를 검사하여 부적절한 내용을
   탐지하고 위험 점수를 업데이트합니다【600149368786617†L190-L197】.
3. **match‑explainer**: 두 프로필을 비교하여 매칭 이유를 생성합니다【600149368786617†L193-L197】.

Edge Functions는 `supabase functions deploy <function-name>` 명령으로
배포할 수 있으며, 로컬에서는 `supabase functions serve`로 테스트할
수 있습니다【600149368786617†L198-L218】. Anthropic API 키를 `.env`에
설정해야 합니다【600149368786617†L268-L271】.

## 추가 서비스 및 배포

도커 구성에는 Redis, MinIO, MailHog, Metabase, Adminer 등 다양한
부가 서비스가 포함되어 있어 캐싱, 파일 저장, 이메일 테스트, BI 분석을
지원합니다【600149368786617†L232-L247】. 프로덕션 배포 시에는 supabase.com
에서 프로젝트를 생성하고, Edge Functions와 환경 변수를 올바르게 설정한
후 배포를 진행합니다【600149368786617†L318-L339】.