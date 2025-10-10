import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { Logger } from "@nestjs/common";
import type { IncomingMessage } from "http";

const logger = new Logger("OpenTelemetry");

export function initializeTracing() {
  const exporterUrl =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "http://localhost:4318/v1/traces";
  const serviceName = process.env.OTEL_SERVICE_NAME || "projectroom-api";
  const serviceVersion = process.env.npm_package_version || "1.0.0";

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  });

  const traceExporter = new OTLPTraceExporter({
    url: exporterUrl,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false, // Reduce noise
        },
        "@opentelemetry/instrumentation-net": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          requestHook: (span, request) => {
            const incomingMsg = request as IncomingMessage;
            if (incomingMsg.headers) {
              span.setAttribute(
                "http.user_agent",
                incomingMsg.headers["user-agent"],
              );
            }
          },
        },
        "@opentelemetry/instrumentation-express": {
          enabled: true,
        },
      }),
    ],
  });

  try {
    sdk.start();
    logger.log(`OpenTelemetry tracing initialized. Exporter: ${exporterUrl}`);

    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => logger.log("OpenTelemetry SDK shut down successfully"))
        .catch((error) => logger.error("Error shutting down SDK", error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    logger.error("Failed to initialize OpenTelemetry", error);
  }

  return sdk;
}
