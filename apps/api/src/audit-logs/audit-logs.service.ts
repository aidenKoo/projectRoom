import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog, AuditAction } from "./entities/audit-log.entity";

export interface CreateLogPayload {
  accessorId: string;
  targetUserId: string;
  action: string;
  reason?: string;
  targetResource?: string;
  details?: Record<string, any>;
  ip?: string | null;
  requestId?: string | null;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(payload: CreateLogPayload): Promise<AuditLog> {
    const trimmedReason =
      typeof payload.reason === "string"
        ? payload.reason.trim().slice(0, 255)
        : undefined;
    const trimmedResource =
      typeof payload.targetResource === "string"
        ? payload.targetResource.trim().slice(0, 255)
        : undefined;

    const mergedDetailsRaw: Record<string, any> = {
      ...(payload.details ?? {}),
    };

    if (trimmedReason) {
      mergedDetailsRaw.reason = trimmedReason;
    }
    if (trimmedResource) {
      mergedDetailsRaw.targetResource = trimmedResource;
    }
    if (payload.ip) {
      mergedDetailsRaw.ip = payload.ip;
    }
    if (payload.requestId) {
      mergedDetailsRaw.requestId = payload.requestId;
    }

    const mergedDetails =
      Object.keys(mergedDetailsRaw).length > 0 ? mergedDetailsRaw : undefined;

    const logEntry = this.auditLogRepository.create({
      action: payload.action as AuditAction,
      accessorId: payload.accessorId,
      targetUserId: payload.targetUserId,
      details: mergedDetails,
    });
    return this.auditLogRepository.save(logEntry);
  }

  async findAll(
    page: number,
    limit: number,
    action?: AuditAction,
    targetUid?: string,
    actorUid?: string,
  ): Promise<{
    items: AuditLog[];
    meta: {
      totalItems: number;
      itemsPerPage: number;
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
    };
  }> {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (safePage - 1) * safeLimit;

    const query = this.auditLogRepository
      .createQueryBuilder("log")
      .orderBy("log.timestamp", "DESC")
      .skip(skip)
      .take(safeLimit);

    if (action) {
      query.andWhere("log.action = :action", { action });
    }

    if (targetUid) {
      query.andWhere("log.targetUserId = :targetUid", { targetUid });
    }

    if (actorUid) {
      query.andWhere("log.accessorId = :actorUid", { actorUid });
    }

    const [items, total] = await query.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

    return {
      items,
      meta: {
        totalItems: total,
        itemsPerPage: safeLimit,
        currentPage: safePage,
        totalPages,
        hasNextPage: safePage < totalPages,
      },
    };
  }

  async findByTargetUser(uid: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { targetUserId: uid },
      order: { timestamp: "DESC" },
      take: 200,
    });
  }

  async findByActor(uid: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { accessorId: uid },
      order: { timestamp: "DESC" },
      take: 200,
    });
  }

  async getStatsByDateRange(
    start: Date,
    end: Date,
  ): Promise<{
    range: { start: string; end: string };
    daily: Array<{
      date: string;
      counts: Partial<Record<AuditAction, number>>;
    }>;
    totals: Partial<Record<AuditAction, number>>;
    totalEvents: number;
  }> {
    if (!(start instanceof Date) || Number.isNaN(start.valueOf())) {
      throw new BadRequestException("start 날짜가 유효하지 않습니다.");
    }
    if (!(end instanceof Date) || Number.isNaN(end.valueOf())) {
      throw new BadRequestException("end 날짜가 유효하지 않습니다.");
    }
    if (start > end) {
      throw new BadRequestException("start 날짜가 end 이후입니다.");
    }

    const rows = await this.auditLogRepository
      .createQueryBuilder("log")
      .select("DATE(log.timestamp)", "date")
      .addSelect("log.action", "action")
      .addSelect("COUNT(*)", "count")
      .where("log.timestamp BETWEEN :start AND :end", { start, end })
      .groupBy("date")
      .addGroupBy("log.action")
      .orderBy("date", "ASC")
      .getRawMany();

    const dailyMap = new Map<
      string,
      { date: string; counts: Partial<Record<AuditAction, number>> }
    >();
    const totals: Partial<Record<AuditAction, number>> = {};
    let totalEvents = 0;

    for (const row of rows) {
      const date = row.date as string;
      const action = row.action as AuditAction;
      const count = Number(row.count) || 0;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          counts: {} as Partial<Record<AuditAction, number>>,
        });
      }
      const entry = dailyMap.get(date)!;
      entry.counts[action] = (entry.counts[action] || 0) + count;

      totals[action] = (totals[action] || 0) + count;
      totalEvents += count;
    }

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      daily: Array.from(dailyMap.values()),
      totals,
      totalEvents,
    };
  }
}
