import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { trace, SpanStatusCode } from "@opentelemetry/api";

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const tracer = trace.getTracer("projectroom-api");
    const req = executionContext.switchToHttp().getRequest();
    const { method, url } = req;

    const spanName = `${method} ${url}`;

    return tracer.startActiveSpan(spanName, (span) => {
      span.setAttribute("http.method", method);
      span.setAttribute("http.url", url);
      span.setAttribute("http.route", req.route?.path || url);

      if (req.user?.uid) {
        span.setAttribute("user.id", req.user.uid);
      }

      return next.handle().pipe(
        tap({
          next: () => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
          },
          error: (error) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
          },
        }),
      );
    });
  }
}
