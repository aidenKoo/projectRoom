import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { AbEvent, AbEventType } from "./entities/ab-event.entity";

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(AbAssignment)
    private readonly assignmentRepo: Repository<AbAssignment>,
    @InjectRepository(AbEvent)
    private readonly eventRepo: Repository<AbEvent>,
  ) {}

  private stableVariant(
    userId: number,
    experiment: string,
    variants: string[],
  ): string {
    // Simple deterministic bucketing by hashing userId+experiment
    const str = `${userId}:${experiment}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // unsigned
    }
    return variants[hash % Math.max(1, variants.length)] || variants[0];
  }

  async getOrAssign(
    userId: number,
    experiment: string,
    variants: string[] = ["A", "B"],
  ): Promise<AbAssignment> {
    let existing = await this.assignmentRepo.findOne({
      where: { userId, experiment },
    });
    if (existing) return existing;

    const variant = this.stableVariant(userId, experiment, variants);
    const created = this.assignmentRepo.create({ userId, experiment, variant });
    return this.assignmentRepo.save(created);
  }

  async forceAssign(
    userId: number,
    experiment: string,
    variant: string,
  ): Promise<AbAssignment> {
    const existing = await this.assignmentRepo.findOne({
      where: { userId, experiment },
    });
    if (existing) {
      existing.variant = variant;
      return this.assignmentRepo.save(existing);
    }
    const created = this.assignmentRepo.create({ userId, experiment, variant });
    return this.assignmentRepo.save(created);
  }

  async remove(id: number): Promise<void> {
    await this.assignmentRepo.delete(id);
  }

  async findById(id: number): Promise<AbAssignment | null> {
    return this.assignmentRepo.findOne({ where: { id } });
  }

  async list(
    options: { experiment?: string; variant?: string; page?: number; limit?: number } = {},
  ) {
    const { experiment, variant, page = 1, limit = 20 } = options;
    const qb = this.assignmentRepo.createQueryBuilder("a");
    if (experiment) qb.andWhere("a.experiment = :experiment", { experiment });
    if (variant) qb.andWhere("a.variant = :variant", { variant });

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const [items, total] = await qb
      .orderBy("a.assignedAt", "DESC")
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return { items, total, page: safePage, limit: safeLimit };
  }

  async variantCounts(experiment: string): Promise<Record<string, number>> {
    const rows = await this.assignmentRepo
      .createQueryBuilder("a")
      .select("a.variant", "variant")
      .addSelect("COUNT(*)", "cnt")
      .where("a.experiment = :experiment", { experiment })
      .groupBy("a.variant")
      .getRawMany<{ variant: string; cnt: string }>();
    return rows.reduce((acc, r) => {
      acc[r.variant] = Number(r.cnt);
      return acc;
    }, {} as Record<string, number>);
  }

  async recordEvent(
    userId: number,
    experiment: string,
    variant: string | undefined,
    event: AbEventType,
    properties?: Record<string, any>,
  ): Promise<AbEvent> {
    let finalVariant = variant;
    if (!finalVariant) {
      const assignment = await this.assignmentRepo.findOne({ where: { userId, experiment } });
      finalVariant = assignment?.variant ?? "A";
    }
    const created = this.eventRepo.create({
      userId,
      experiment,
      variant: finalVariant!,
      event,
      properties: properties ?? null,
    });
    return this.eventRepo.save(created);
  }

  async getStats(
    experiment: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    experiment: string;
    variants: Array<{ variant: string; exposures: number; conversions: number; conversionRate: number }>;
    totals: { exposures: number; conversions: number; conversionRate: number };
  }> {
    const where: any = { experiment };
    if (dateFrom && dateTo) {
      where.createdAt = Between(dateFrom, dateTo);
    } else if (dateFrom) {
      where.createdAt = Between(dateFrom, new Date());
    }

    const rows = await this.eventRepo
      .createQueryBuilder("e")
      .select("e.variant", "variant")
      .addSelect(
        "SUM(CASE WHEN e.event = 'exposure' THEN 1 ELSE 0 END)",
        "exposures",
      )
      .addSelect(
        "SUM(CASE WHEN e.event = 'conversion' THEN 1 ELSE 0 END)",
        "conversions",
      )
      .where("e.experiment = :experiment", { experiment })
      .andWhere(
        dateFrom && dateTo ? "e.created_at BETWEEN :from AND :to" : dateFrom ? "e.created_at >= :from" : "1=1",
        { from: dateFrom, to: dateTo },
      )
      .groupBy("e.variant")
      .getRawMany<{ variant: string; exposures: string; conversions: string }>();

    const variants = rows.map((r) => {
      const exposures = Number(r.exposures) || 0;
      const conversions = Number(r.conversions) || 0;
      const conversionRate = exposures > 0 ? conversions / exposures : 0;
      return { variant: r.variant, exposures, conversions, conversionRate };
    });

    const totals = variants.reduce(
      (acc, v) => {
        acc.exposures += v.exposures;
        acc.conversions += v.conversions;
        return acc;
      },
      { exposures: 0, conversions: 0 },
    );

    const totalRate = totals.exposures > 0 ? totals.conversions / totals.exposures : 0;

    return {
      experiment,
      variants,
      totals: { ...totals, conversionRate: totalRate },
    };
  }
}
