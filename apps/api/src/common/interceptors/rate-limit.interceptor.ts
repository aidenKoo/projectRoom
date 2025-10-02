import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly limit: number = 100, // 기본 100회
    private readonly windowSeconds: number = 60, // 기본 60초
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip || request.connection.remoteAddress;

    // 사용자 식별자 (로그인 시 uid, 아니면 IP)
    const identifier = user?.uid || `ip:${ip}`;
    const key = `rate_limit:${identifier}`;

    // 현재 요청 수 조회
    const current = await this.redisService.get(key);
    const currentCount = current ? parseInt(current, 10) : 0;

    if (currentCount >= this.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          limit: this.limit,
          windowSeconds: this.windowSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 카운트 증가
    if (currentCount === 0) {
      // 첫 요청이면 TTL 설정
      await this.redisService.set(key, '1', this.windowSeconds);
    } else {
      // 이미 있으면 증가
      await this.redisService.incr(key);
    }

    return next.handle();
  }
}

// 사용 예시: @UseInterceptors(new RateLimitInterceptor(redisService, 10, 60))
