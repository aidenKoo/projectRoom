import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const initializeFirebase = (configService: ConfigService) => {
  const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
  const privateKey = configService
    .get<string>('FIREBASE_PRIVATE_KEY', '')
    .replace(/\\n/g, '\n');
  const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');

  // Skip Firebase init if credentials are not provided (for development)
  if (!projectId || !privateKey || !clientEmail) {
    console.log('⚠️  Firebase credentials not configured. Skipping Firebase initialization.');
    console.log('   Firebase Auth Guard will not work without proper credentials.');
    return admin;
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
        storageBucket: configService.get<string>('FIREBASE_STORAGE_BUCKET'),
      });
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
    }
  }

  return admin;
};
