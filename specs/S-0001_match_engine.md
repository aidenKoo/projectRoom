# S-0001 매칭 엔진

## 목적

고객의 선호, 활동, 품질 지표를 입력으로 받아 0~100 사이의 점수를 산출하는 매칭 엔진을 설계합니다. 이 점수는 추천 시스템과 매칭 알고리즘에서 사용됩니다.

## 데이터 계약(단일 출처)

- **입력**: `MatchCandidate` 객체
  - `age`: integer
  - `distance_km`: number (0~200)
  - `interests`: string[]
  - `photo_quality`: number (0~1)
  - `last_active_min`: integer (분 단위 활동 지표)
- **출력**: 객체
  - `score`: number (0~100)
  - `reasons`: string[] (선택사항, 점수 산정 이유)

## 규칙

- **가중치**: `w_age = 0.15`, `w_distance = 0.20`, `w_interest = 0.35`, `w_activity = 0.20`, `w_quality = 0.10`
- **제약**: `distance_km > 50`인 경우 최대 점수는 85로 상한을 둡니다.
- **경계조건**: 나이 차이가 12세를 초과할 경우 interest 가중치를 20% 감소시킵니다.
- **성능**: `p95 latency ≤ 5ms` per candidate on Node.js 20, single thread, local environment

## 테스트 케이스(필수)

- **TC-01**: 기본 케이스 – age=30, distance=10, interests가 3개 일치하는 상황에서 점수가 적절히 산출되는지 확인
- **TC-02**: 경계 거리 – distance=50, photo_quality=1일 때 상한 규칙 적용 여부 확인
- **TC-03**: 나이 차 경계 – age=25와 파트너 age=40에서 interest 가중 감쇠 적용 여부 확인
- **TC-04**: 활동이 거의 없는 사용자 – `last_active_min=10000`일 때 activity 가중치가 감소하는지 확인
- **TC-05**: 사진 품질이 낮은 경우 – `photo_quality=0`일 때 quality 가중치 영향 확인
