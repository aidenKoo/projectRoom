import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AbAssignment } from "./entities/ab-assignment.entity";

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(AbAssignment)
    private readonly assignmentRepo: Repository<AbAssignment>,
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
}
