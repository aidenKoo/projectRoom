import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {
    // Firebase Admin SDK 초기화
    if (!admin.apps.length) {
      const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');

      if (serviceAccount) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
          });
        } catch (error) {
          console.warn('Firebase Admin SDK initialization failed:', error.message);
        }
      } else {
        // 개발 환경에서 서비스 계정이 없을 경우 경고
        console.warn('Firebase service account not configured. Auth will be disabled in production.');
      }
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Firebase ID Token 검증
      const decodedToken = await admin.auth().verifyIdToken(token);

      // 검증된 사용자 정보를 request에 추가
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        role: (decodedToken as any).role || 'user', // Custom claims에서 role 가져오기
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
