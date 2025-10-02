import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Referral } from "./entities/referral.entity";

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  /**
   * 추천인 정보 저장
   */
  async create(userId: number, referrerName: string): Promise<Referral> {
    const referral = this.referralRepository.create({
      userId,
      referrerName,
    });

    return this.referralRepository.save(referral);
  }

  /**
   * 사용자의 추천인 정보 조회
   */
  async findByUserId(userId: number): Promise<Referral | null> {
    return this.referralRepository.findOne({ where: { userId } });
  }

  /**
   * 추천인별 통계 조회 (관리자용)
   */
  async getReferrerStats(): Promise<any[]> {
    const result = await this.referralRepository
      .createQueryBuilder("referral")
      .select("referral.referrerName", "referrerName")
      .addSelect("COUNT(*)", "count")
      .groupBy("referral.referrerName")
      .orderBy("count", "DESC")
      .getRawMany();

    return result;
  }

  /**
   * 특정 추천인의 가입자 목록 (관리자용)
   */
  async findByReferrerName(referrerName: string): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { referrerName },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 최근 추천인 목록 (관리자용)
   */
  async findRecent(limit: number = 50): Promise<Referral[]> {
    return this.referralRepository.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
