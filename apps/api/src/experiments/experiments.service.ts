import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { AbEvent, AbEventType } from "./entities/ab-event.entity";
import { AbExperiment } from "./entities/ab-experiment.entity";

type VariantFilters = {
  regions?: string[];
  platforms?: string[];
  newUserDays?: number;
};

type VariantConfig = {
  key: string;
  weight: number;
  filters?: VariantFilters;
};

export type ExperimentConfig = {
  defaultVariant: string;
  variants: VariantConfig[];
};

export type AssignmentContext = {
  regionCode?: string | null;
  createdAt?: Date | null;
  platform?: string | null;
};

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(AbAssignment)
    private readonly assignmentRepo: Repository<AbAssignment>,
    @InjectRepository(AbEvent)
    private readonly eventRepo: Repository<AbEvent>,
    @InjectRepository(AbExperiment)
    private readonly experimentRepo: Repository<AbExperiment>,
  ) {}

  private configCache = new Map<string, ExperimentConfig>();

  private matchesFilters(filters: VariantFilters | undefined, context: AssignmentContext): boolean {
    if (!filters) return true;
    if (filters.regions && filters.regions.length) {
      const region = context.regionCode ?? undefined;
      if (!region || !filters.regions.includes(region)) {
        return false;
      }
    }
    if (filters.platforms && filters.platforms.length) {
      const platform = context.platform?.toLowerCase();
      const normalized = filters.platforms.map((p) => p.toLowerCase());
      if (!platform || !normalized.includes(platform)) {
        return false;
      }
    }
    if (filters.newUserDays && filters.newUserDays > 0) {
      const createdAt = context.createdAt ?? undefined;
      if (!createdAt) return false;
      const diffMs = Date.now() - createdAt.getTime();
      const limitMs = filters.newUserDays * 24 * 60 * 60 * 1000;
      if (diffMs > limitMs) {
        return false;
      }
    }
    return true;
  }

  private deterministicPick(
    userId: number,
    experiment: string,
    variants: VariantConfig[],
  ): string {
    const totalWeight = variants.reduce((sum, v) => sum + Math.max(v.weight, 0), 0);
    if (!totalWeight || totalWeight <= 0) {
      return variants[0]?.key ?? "A";
    }
    const str = `${userId}:${experiment}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    const normalized = (hash % 10000) / 10000; // 0-0.9999
    let cumulative = 0;
    for (const variant of variants) {
      const weight = Math.max(variant.weight, 0) / totalWeight;
      cumulative += weight;
      if (normalized <= cumulative + 1e-8) {
        return variant.key;
      }
    }
    return variants[variants.length - 1]?.key ?? "A";
  }

  private filterEligibleVariants(
    config: ExperimentConfig,
    allowedKeys: string[] | undefined,
    context: AssignmentContext,
  ): VariantConfig[] {
    const keysSet = allowedKeys && allowedKeys.length ? new Set(allowedKeys) : null;
    return config.variants.filter((variant) => {
      if (keysSet && !keysSet.has(variant.key)) {
        return false;
      }
      return this.matchesFilters(variant.filters, context);
    });
  }

  private fallbackVariant(config: ExperimentConfig | null, variants: string[]): string {
    if (config?.defaultVariant) return config.defaultVariant;
    if (variants.length > 0) return variants[0];
    return "A";
  }

  private async getConfig(experiment: string): Promise<ExperimentConfig | null> {
    if (this.configCache.has(experiment)) {
      return this.configCache.get(experiment)!;
    }
    const record = await this.experimentRepo.findOne({ where: { experiment } });
    if (!record) return null;
    const config = record.config as ExperimentConfig;
    if (!config || !Array.isArray(config.variants)) {
      return null;
    }
    this.configCache.set(experiment, config);
    return config;
  }

  async upsertConfig(experiment: string, config: ExperimentConfig): Promise<ExperimentConfig> {
    if (!config?.variants?.length) {
      throw new BadRequestException("variants must not be empty");
    }
    if (!config.variants.some((v) => v.key === config.defaultVariant)) {
      throw new BadRequestException("defaultVariant must exist in variants");
    }
    const totalWeight = config.variants.reduce((sum, variant) => sum + Math.max(variant.weight, 0), 0);
    if (totalWeight <= 0) {
      throw new BadRequestException("Sum of variant weights must be greater than zero");
    }
    await this.experimentRepo.upsert({ experiment, config: config as any }, ["experiment"]);
    this.configCache.set(experiment, config);
    return config;
  }

  async getConfigRaw(experiment: string): Promise<ExperimentConfig | null> {
    const config = await this.getConfig(experiment);
    return config ?? null;
  }

  async getOrAssign(
    userId: number,
    experiment: string,
    variants: string[] = ["A", "B"],
    context: AssignmentContext = {},
  ): Promise<AbAssignment> {
    let existing = await this.assignmentRepo.findOne({
      where: { userId, experiment },
    });

    const config = await this.getConfig(experiment);

    let variantPool: VariantConfig[] = [];
    if (config) {
      const allowedSet = variants && variants.length ? new Set(variants) : null;
      const base = config.variants.filter((variant) =>
        !allowedSet || allowedSet.has(variant.key),
      );
      const eligible = this.filterEligibleVariants(config, variants, context);
      if (eligible.length > 0) {
        variantPool = eligible;
      } else if (base.length > 0) {
        variantPool = base;
      } else if (config.variants.length > 0) {
        variantPool = config.variants;
      }
    }

    if (variantPool.length === 0) {
      const allowed = variants.length > 0 ? variants : ["A", "B"];
      variantPool = allowed.map((key) => ({ key, weight: 1 } as VariantConfig));
    }

    const selectedVariant = this.deterministicPick(userId, experiment, variantPool);
    const finalVariant = selectedVariant || this.fallbackVariant(config, variants);

    if (existing) {
      if (existing.variant !== finalVariant) {
        existing.variant = finalVariant;
        return this.assignmentRepo.save(existing);
      }
      return existing;
    }

    const created = this.assignmentRepo.create({ userId, experiment, variant: finalVariant });
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

  async recordConversionForUser(
    userId: number,
    properties?: Record<string, any>,
  ): Promise<void> {
    const assignments = await this.assignmentRepo.find({ where: { userId } });
    await Promise.all(
      assignments.map((assignment) =>
        this.recordEvent(
          userId,
          assignment.experiment,
          assignment.variant,
          "conversion",
          properties,
        ),
      ),
    );
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
