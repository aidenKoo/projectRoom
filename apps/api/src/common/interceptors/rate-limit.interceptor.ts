import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { RedisService } from "../cache/redis.service";
import { Reflector } from "@nestjs/core";
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from "../decorators/rate-limit.decorator";

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const rateLimitOptions =
      this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
        RATE_LIMIT_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? undefined;

    if (!rateLimitOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip || request.connection?.remoteAddress;

    // 사용자 식별자 (로그인 시 uid, 아니면 IP)
    const identifier = user?.uid || `ip:${ip}`;
    const handlerName = context.getHandler().name || "unknown";
    const className = context.getClass().name || "unknown";
    const key = `rate_limit:${identifier}:${className}:${handlerName}`;

    const redisClient = this.redisService.getClient();
    if (!redisClient?.isOpen) {
      return next.handle();
    }

    const { limit, windowSeconds } = rateLimitOptions;

    try {
      const currentCount = await this.redisService.incr(key);

      if (!currentCount) {
        return next.handle();
      }

      if (currentCount === 1) {
        await this.redisService.expire(key, windowSeconds);
      }

      if (currentCount > limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: "Too many requests. Please try again later.",
            limit,
            windowSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn(
        `Rate limit check failed (${className}.${handlerName}): ${error?.message ?? error}`,
      );
      // Redis 오류 시에는 레이트리밋을 우회하고 요청을 진행
    }

    return next.handle();
  }
}

// 사용 예시: @UseInterceptors(new RateLimitInterceptor(redisService, 10, 60))
