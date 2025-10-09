import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "./storage.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";

@Controller("storage")
@UseGuards(FirebaseAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload/photo")
  @UseInterceptors(FileInterceptor("file"))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const result = await this.storageService.uploadImage(
      file,
      userId,
      "photos",
    );

    return {
      success: true,
      ...result,
    };
  }

  @Post("upload/profile")
  @UseInterceptors(FileInterceptor("file"))
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const result = await this.storageService.uploadImage(
      file,
      userId,
      "profiles",
    );

    return {
      success: true,
      ...result,
    };
  }
}
