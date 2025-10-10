import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { metrics, ValueType } from "@opentelemetry/api";

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private meter: ReturnType<typeof metrics.getMeter>;

  // Counters
  private httpRequestCounter: any;
  private httpErrorCounter: any;
  private authAttemptCounter: any;
  private photoUploadCounter: any;
  private moderationCounter: any;

  // Histograms
  private httpDurationHistogram: any;
  private dbQueryDurationHistogram: any;

  onModuleInit() {
    if (process.env.OTEL_ENABLED !== "true") {
      this.logger.log("Metrics disabled (OTEL_ENABLED not set to true)");
      return;
    }

    this.meter = metrics.getMeter("projectroom-api");

    // Initialize counters
    this.httpRequestCounter = this.meter.createCounter("http_requests_total", {
      description: "Total number of HTTP requests",
      valueType: ValueType.INT,
    });

    this.httpErrorCounter = this.meter.createCounter("http_errors_total", {
      description: "Total number of HTTP errors",
      valueType: ValueType.INT,
    });

    this.authAttemptCounter = this.meter.createCounter("auth_attempts_total", {
      description: "Total number of authentication attempts",
      valueType: ValueType.INT,
    });

    this.photoUploadCounter = this.meter.createCounter("photo_uploads_total", {
      description: "Total number of photo uploads",
      valueType: ValueType.INT,
    });

    this.moderationCounter = this.meter.createCounter(
      "moderation_decisions_total",
      {
        description: "Total number of moderation decisions",
        valueType: ValueType.INT,
      },
    );

    // Initialize histograms
    this.httpDurationHistogram = this.meter.createHistogram(
      "http_request_duration_ms",
      {
        description: "HTTP request duration in milliseconds",
        valueType: ValueType.DOUBLE,
      },
    );

    this.dbQueryDurationHistogram = this.meter.createHistogram(
      "db_query_duration_ms",
      {
        description: "Database query duration in milliseconds",
        valueType: ValueType.DOUBLE,
      },
    );

    this.logger.log("Metrics service initialized");
  }

  recordHttpRequest(method: string, route: string, statusCode: number) {
    if (!this.httpRequestCounter) return;
    this.httpRequestCounter.add(1, { method, route, status: statusCode });
  }

  recordHttpError(method: string, route: string, statusCode: number) {
    if (!this.httpErrorCounter) return;
    this.httpErrorCounter.add(1, { method, route, status: statusCode });
  }

  recordHttpDuration(method: string, route: string, durationMs: number) {
    if (!this.httpDurationHistogram) return;
    this.httpDurationHistogram.record(durationMs, { method, route });
  }

  recordAuthAttempt(method: string, success: boolean) {
    if (!this.authAttemptCounter) return;
    this.authAttemptCounter.add(1, { method, success: success.toString() });
  }

  recordPhotoUpload(userId: number, success: boolean) {
    if (!this.photoUploadCounter) return;
    this.photoUploadCounter.add(1, { success: success.toString() });
  }

  recordModerationDecision(decision: string, automated: boolean) {
    if (!this.moderationCounter) return;
    this.moderationCounter.add(1, {
      decision,
      automated: automated.toString(),
    });
  }

  recordDbQueryDuration(queryName: string, durationMs: number) {
    if (!this.dbQueryDurationHistogram) return;
    this.dbQueryDurationHistogram.record(durationMs, { query: queryName });
  }
}
