import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class StorageService {
  private storage?: admin.storage.Storage;
  private bucketName?: string;

  constructor(private configService: ConfigService) {
    // Firebase Storage bucket 초기화
    if (admin.apps.length) {
      this.storage = admin.storage();
      this.bucketName =
        this.configService.get<string>("FIREBASE_STORAGE_BUCKET") ||
        (this.storage.app.options.storageBucket as string | undefined);

      if (!this.bucketName) {
        console.warn("Firebase Storage bucket not configured");
      }
    }
  }

  private getBucket() {
    if (!this.storage) {
      throw new InternalServerErrorException(
        "Firebase Storage가 초기화되지 않았습니다.",
      );
    }

    if (!this.bucketName) {
      throw new InternalServerErrorException(
        "Firebase Storage bucket 설정이 필요합니다.",
      );
    }

    return this.storage.bucket(this.bucketName);
  }

  /**
   * 이미지 업로드
   * @param file - 업로드할 파일
   * @param userId - 사용자 UID
   * @param folder - 폴더명 (예: 'profiles', 'photos')
   * @returns 업로드된 파일의 공개 URL
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    folder: string = "photos",
  ): Promise<{ objectPath: string; publicUrl: string }> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // 파일 타입 검증
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Only JPEG, PNG, and WebP images are allowed",
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException("File size must not exceed 10MB");
    }

    // 파일명 생성
    const fileExtension = file.mimetype.split("/")[1];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const objectPath = `users/${userId}/${folder}/${fileName}`;

    try {
      const bucket = this.getBucket();

      // Firebase Storage에 업로드
      const bucketFile = bucket.file(objectPath);

      await bucketFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // 공개 URL 생성 (옵션)
      await bucketFile.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;

      return {
        objectPath,
        publicUrl,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * 파일 삭제
   * @param objectPath - 삭제할 파일 경로
   */
  async deleteFile(objectPath: string): Promise<void> {
    try {
      const bucket = this.getBucket();
      await bucket.file(objectPath).delete();
    } catch (error) {
      console.error("Failed to delete file:", error.message);
    }
  }

  /**
   * Signed URL 생성 (임시 접근 URL)
   * @param objectPath - 파일 경로
   * @param expiresInMinutes - 만료 시간 (분)
   */
  async getSignedUrl(
    objectPath: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    const bucket = this.getBucket();
    const [url] = await bucket.file(objectPath).getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  }
}
