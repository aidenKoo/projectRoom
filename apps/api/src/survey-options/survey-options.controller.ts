import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Headers,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { SurveyOptionsService } from "./survey-options.service";
import { CreateSurveyOptionDto } from "./dto/create-survey-option.dto";
import { UpdateSurveyOptionDto } from "./dto/update-survey-option.dto";
import { OptionCategory } from "./entities/survey-option.entity";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { extractRequestContext } from "../common/utils/request-context.util";
import { AuditAction } from "../audit-logs/entities/audit-log.entity";

@Controller("survey-options")
export class SurveyOptionsController {
  constructor(private readonly surveyOptionsService: SurveyOptionsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  create(
    @Body() createDto: CreateSurveyOptionDto,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.surveyOptionsService.create(createDto, {
      accessorId,
      reason,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      ip,
      requestId,
      userAgent,
    });
  }

  @Get()
  findAll() {
    return this.surveyOptionsService.findAll();
  }

  @Get("category/:category")
  findByCategory(@Param("category") category: OptionCategory) {
    return this.surveyOptionsService.findByCategory(category);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.surveyOptionsService.findOne(id);
  }

  @Put(":id")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateSurveyOptionDto,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.surveyOptionsService.update(id, updateDto, {
      accessorId,
      reason,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      ip,
      requestId,
      userAgent,
    });
  }

  @Delete(":id")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.surveyOptionsService.remove(id, {
      accessorId,
      reason,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      ip,
      requestId,
      userAgent,
    });
  }

  @Patch(":id/toggle")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  toggleActive(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.surveyOptionsService.toggleActive(id, {
      accessorId,
      reason,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      ip,
      requestId,
      userAgent,
    });
  }
}
