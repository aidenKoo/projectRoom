import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PhotoModerationService } from "./photo-moderation.service";
import { ModerationWebhookDto } from "./dto/moderation-webhook.dto";

@Controller("internal/photos/moderation")
export class PhotoModerationWebhookController {
  constructor(
    private readonly photoModerationService: PhotoModerationService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("x-webhook-secret") secret: string | undefined,
    @Body() body: ModerationWebhookDto,
  ) {
    const expectedSecret = this.configService.get<string>(
      "PHOTO_MODERATION_WEBHOOK_SECRET",
    );

    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid webhook secret");
    }

    await this.photoModerationService.handleAutoModerationResult(
      body.metaId,
      body.result,
    );

    return { ok: true };
  }
}
