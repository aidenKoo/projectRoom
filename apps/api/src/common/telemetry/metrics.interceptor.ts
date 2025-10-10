import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = executionContext.switchToHttp().getRequest();
    const res = executionContext.switchToHttp().getResponse();
    const { method, route } = req;
    const routePath = route?.path || req.url;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.metricsService.recordHttpRequest(
            method,
            routePath,
            res.statusCode,
          );
          this.metricsService.recordHttpDuration(method, routePath, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.metricsService.recordHttpRequest(method, routePath, statusCode);
          this.metricsService.recordHttpError(method, routePath, statusCode);
          this.metricsService.recordHttpDuration(method, routePath, duration);
        },
      }),
    );
  }
}
