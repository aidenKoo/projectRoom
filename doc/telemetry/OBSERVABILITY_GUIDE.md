# 운영 관측성 가이드

## 개요

ProjectRoom API는 OpenTelemetry를 사용하여 분산 트레이싱과 메트릭 수집을 지원합니다. 이를 통해 프로덕션 환경에서 애플리케이션의 성능과 동작을 모니터링할 수 있습니다.

## 활성화 방법

`.env` 파일에서 OpenTelemetry를 활성화하세요:

```env
OTEL_ENABLED=true
OTEL_SERVICE_NAME=projectroom-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

## 기능

### 1. 분산 트레이싱

모든 HTTP 요청과 데이터베이스 쿼리가 자동으로 추적됩니다.

**추적되는 정보:**
- HTTP 메서드, URL, 상태 코드
- 요청 처리 시간
- 사용자 ID (인증된 경우)
- 에러 스택 트레이스

**구현 파일:**
- [tracing.ts](../../apps/api/src/common/telemetry/tracing.ts) - OpenTelemetry SDK 초기화
- [tracing.interceptor.ts](../../apps/api/src/common/telemetry/tracing.interceptor.ts) - NestJS 인터셉터

### 2. 메트릭 수집

다음 메트릭이 자동으로 수집됩니다:

#### Counters
- `http_requests_total` - HTTP 요청 총 개수 (method, route, status별)
- `http_errors_total` - HTTP 에러 총 개수
- `auth_attempts_total` - 인증 시도 횟수
- `photo_uploads_total` - 사진 업로드 횟수
- `moderation_decisions_total` - 모더레이션 결정 횟수

#### Histograms
- `http_request_duration_ms` - HTTP 요청 처리 시간
- `db_query_duration_ms` - 데이터베이스 쿼리 시간

**구현 파일:**
- [metrics.service.ts](../../apps/api/src/common/telemetry/metrics.service.ts) - 메트릭 서비스
- [metrics.interceptor.ts](../../apps/api/src/common/telemetry/metrics.interceptor.ts) - 메트릭 수집 인터셉터

### 3. 자동 계측

다음이 자동으로 계측됩니다:
- HTTP/HTTPS 요청
- Express 라우팅
- 네트워크 호출

## 백엔드 연동

### Jaeger (분산 트레이싱)

```bash
# Docker로 Jaeger 실행
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# 환경 변수 설정
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

Jaeger UI: http://localhost:16686

### Prometheus + Grafana (메트릭)

OpenTelemetry Collector를 사용하여 Prometheus로 메트릭을 내보낼 수 있습니다.

**OpenTelemetry Collector 설정 예제:**

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      exporters: [prometheus]
```

## 커스텀 메트릭 추가

서비스에서 `MetricsService`를 주입하여 커스텀 메트릭을 기록할 수 있습니다:

```typescript
import { MetricsService } from '@/common/telemetry/metrics.service';

@Injectable()
export class MyService {
  constructor(private readonly metricsService: MetricsService) {}

  async myMethod() {
    // 사진 업로드 메트릭 기록
    this.metricsService.recordPhotoUpload(userId, true);

    // 모더레이션 결정 메트릭 기록
    this.metricsService.recordModerationDecision('approved', false);

    // DB 쿼리 시간 기록
    const start = Date.now();
    await this.repository.find();
    this.metricsService.recordDbQueryDuration('findUsers', Date.now() - start);
  }
}
```

## 프로덕션 권장사항

1. **샘플링 설정**: 트래픽이 많은 경우 샘플링 비율을 조정하세요
2. **리소스 제한**: OpenTelemetry Collector에 적절한 리소스 제한을 설정하세요
3. **보안**: OTLP 엔드포인트는 내부 네트워크에서만 접근 가능하도록 설정하세요
4. **알림 설정**: Prometheus AlertManager를 사용하여 임계값 기반 알림을 설정하세요

## 트러블슈팅

### 트레이스가 표시되지 않는 경우

1. `OTEL_ENABLED=true`로 설정되어 있는지 확인
2. OTLP 엔드포인트가 접근 가능한지 확인
3. 애플리케이션 로그에서 OpenTelemetry 초기화 메시지 확인

### 메트릭이 수집되지 않는 경우

1. OpenTelemetry Collector가 실행 중인지 확인
2. Collector 설정에서 metrics 파이프라인이 구성되어 있는지 확인
3. Prometheus 엔드포인트에서 메트릭이 노출되는지 확인 (`http://collector:8889/metrics`)

## 참고 자료

- [OpenTelemetry 공식 문서](https://opentelemetry.io/docs/)
- [NestJS OpenTelemetry 가이드](https://docs.nestjs.com/recipes/opentelemetry)
- [Jaeger 문서](https://www.jaegertracing.io/docs/)
- [Prometheus 문서](https://prometheus.io/docs/)
