import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { PhotosService } from "./photos.service";
import { UsersService } from "../users/users.service";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";

@ApiTags("photos")
@Controller("v1/photos")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth("firebase")
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Upload a new photo (after Firebase Storage upload)",
  })
  async create(@Request() req, @Body() createPhotoDto: CreatePhotoDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.photosService.create(user.id, createPhotoDto);
  }

  @Get()
  @ApiOperation({ summary: "Get photos (own or by userId)" })
  @ApiQuery({
    name: "me",
    required: false,
    description: "Set to 1 to get own photos",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    description: "Get photos of specific user",
  })
  async findAll(
    @Request() req,
    @Query("me") me?: string,
    @Query("userId") userId?: string,
  ) {
    if (me === "1") {
      const firebaseUid = req.user.uid;
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
      return this.photosService.findByUserId(user.id);
    }

    if (userId) {
      return this.photosService.findByUserId(parseInt(userId, 10));
    }

    // Default: return own photos
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.photosService.findByUserId(user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update photo (e.g., set as primary)" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.photosService.update(parseInt(id, 10), user.id, updatePhotoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a photo" })
  async remove(@Request() req, @Param("id") id: string) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    await this.photosService.remove(parseInt(id, 10), user.id);
    return { message: "Photo deleted successfully" };
  }
}
