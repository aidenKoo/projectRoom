import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "./storage.service";

@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload/photo")
  // @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.uid || "test-user"; // Placeholder

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
  // @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user?.uid || "test-user"; // Placeholder

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
