# System Core Prompt v1

- 절대 규칙:
  1) 출력은 반드시 지정된 파일 집합으로 한정합니다.
  2) 외부 통신, 키, 토큰 생성은 금지하며 `.env` 파일로도 노출하지 않습니다.
  3) 질문 재요청 없이 모호한 부분이 있으면 합리적 가정을 한 뒤 코드와 주석에 명시합니다.

- 코드 규칙:
  - TypeScript 옵션에서 `strict: true`, `noImplicitAny: true`를 사용합니다.
  - ESLint는 Airbnb 기반 규칙을 사용하며, 모든 경고는 오류로 처리합니다.
  - 프로덕션 환경에서는 `console.*`를 사용하지 않고 `pino`를 사용합니다.

- 산출물 포맷 예시:

  ```files
  /path/file1.ext
  <<CODE>>
  /path/file2.ext
  <<TEST>>
  ```
