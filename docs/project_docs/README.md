# ProjectRoom 문서 요약

이 디렉터리는 기존 `projectRoom` 저장소의 `/doc` 폴더에 있던 문서들을 재편집하여
LLM 표준에 맞춰 재구성한 것입니다. 원본 문서는 한국어로 작성되어 있었으며
주요 문서와 개발 진행 기록을 이해하기 쉽게 정리했습니다. 각 문서의 상세
내용은 원본 저장소를 참고하세요.

## 문서 목록

- **PRD 요약** (`PRD_summary.md`): 프로젝트 요구사항 명세서인 `작업서.txt`의
  핵심만 요약한 문서입니다. 제품 개요, 사용자 여정, 데이터 모델, 매칭
  알고리즘, 관리자 기능 및 보안 정책 등을 간결하게 정리했습니다.
- **개발 진행 기록** (`progressLog/`): 개발 과정에서 작성된 진행 보고서를
  요약본으로 제공합니다.
  - `PROJECT_COMPLETE.md`: 백엔드 API 구현 완료 후 작성된 최종 보고서.
  - `DEVELOPMENT_STATUS_v2.md`: 작업서 반영 후 신규 기능과 마이그레이션
    내용을 포함한 v2.0 진행 상황.
  - `DEVELOPMENT_STATUS_v1.md`: 기본 인프라와 주요 모듈 구현 완료 시점의
    현황 보고.
  - `FIREBASE_SETUP.md`: Firebase 프로젝트 생성과 NestJS/Flutter 통합을
    위한 설정 가이드.
  - `README-SUPABASE.md`: Supabase 개발 환경, 주요 서비스 및
    Edge Functions(Claude API 통합)을 안내하는 참고 문서.

## 사용 가이드

프로젝트에 새로 참여하는 개발자는 다음 순서로 문서를 읽는 것을 권장합니다.

1. `PRD_summary.md` – 전체 요구사항과 아키텍처를 빠르게 이해합니다.
2. `progressLog/PROJECT_COMPLETE.md` – 현재까지 구현된 기능과 남은 과제를
   확인합니다.
3. `progressLog/DEVELOPMENT_STATUS_v2.md` – 작업서 기반의 최신 개발 현황을
   확인합니다.
4. 환경 설정이 필요하다면 `progressLog/FIREBASE_SETUP.md`와
   `progressLog/README-SUPABASE.md`를 참고하여 개발 환경을 준비합니다.

문서의 모든 내용은 2025‑10‑02 기준으로 작성되었으며, 이후 업데이트가
필요할 수 있습니다.