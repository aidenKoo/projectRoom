import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { sanitizeInput } from "../utils/sanitize.util";

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request) {
      if (request.body) {
        request.body = sanitizeInput(request.body);
      }

      if (request.query) {
        request.query = sanitizeInput(request.query);
      }

      if (request.params) {
        request.params = sanitizeInput(request.params);
      }
    }

    return next.handle();
  }
}
