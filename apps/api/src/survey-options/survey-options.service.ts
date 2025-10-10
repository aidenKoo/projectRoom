import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SurveyOption, OptionCategory } from "./entities/survey-option.entity";
import { CreateSurveyOptionDto } from "./dto/create-survey-option.dto";
import { UpdateSurveyOptionDto } from "./dto/update-survey-option.dto";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuditAction } from "../audit-logs/entities/audit-log.entity";

interface AuditContext {
  accessorId: string;
  reason: string;
  action: AuditAction;
  ip?: string;
  requestId?: string;
  userAgent?: string;
}

@Injectable()
export class SurveyOptionsService {
  constructor(
    @InjectRepository(SurveyOption)
    private readonly surveyOptionRepository: Repository<SurveyOption>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createDto: CreateSurveyOptionDto,
    auditContext?: AuditContext,
  ): Promise<SurveyOption> {
    const option = this.surveyOptionRepository.create(createDto);
    const saved = await this.surveyOptionRepository.save(option);

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: "survey-options:create",
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          id: saved.id,
          category: saved.category,
          value: saved.value,
          sortOrder: saved.sortOrder,
          isActive: saved.isActive,
          userAgent: auditContext.userAgent,
          operation: "create",
        },
      });
    }

    return saved;
  }

  async findAll(): Promise<SurveyOption[]> {
    return this.surveyOptionRepository.find({
      order: { category: "ASC", sortOrder: "ASC" },
    });
  }

  async findByCategory(category: OptionCategory): Promise<SurveyOption[]> {
    return this.surveyOptionRepository.find({
      where: { category, isActive: true },
      order: { sortOrder: "ASC" },
    });
  }

  async findOne(id: number): Promise<SurveyOption> {
    const option = await this.surveyOptionRepository.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException(`SurveyOption with ID ${id} not found`);
    }
    return option;
  }

  async update(
    id: number,
    updateDto: UpdateSurveyOptionDto,
    auditContext?: AuditContext,
  ): Promise<SurveyOption> {
    const option = await this.findOne(id);
    Object.assign(option, updateDto);
    const saved = await this.surveyOptionRepository.save(option);

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: `survey-options:${id}`,
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          id,
          category: saved.category,
          value: saved.value,
          sortOrder: saved.sortOrder,
          isActive: saved.isActive,
          userAgent: auditContext.userAgent,
          operation: "update",
        },
      });
    }

    return saved;
  }

  async remove(id: number, auditContext?: AuditContext): Promise<void> {
    const option = await this.findOne(id);
    await this.surveyOptionRepository.remove(option);

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: `survey-options:${id}`,
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          id,
          category: option.category,
          value: option.value,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
          userAgent: auditContext.userAgent,
          operation: "delete",
        },
      });
    }
  }

  async toggleActive(
    id: number,
    auditContext?: AuditContext,
  ): Promise<SurveyOption> {
    const option = await this.findOne(id);
    option.isActive = !option.isActive;
    const saved = await this.surveyOptionRepository.save(option);

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: `survey-options:${id}`,
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          id,
          category: saved.category,
          value: saved.value,
          sortOrder: saved.sortOrder,
          isActive: saved.isActive,
          userAgent: auditContext.userAgent,
          operation: "toggle",
        },
      });
    }

    return saved;
  }
}
