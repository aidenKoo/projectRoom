import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { MonthlyCode } from './entities/monthly-code.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CodesService {
  constructor(
    @InjectRepository(MonthlyCode)
    private monthlyCodeRepository: Repository<MonthlyCode>,
  ) {}

  /**
   * 매월 1일 00:00 KST에 자동으로 코드 생성
   * 크론: '0 0 1 * *' (매월 1일 0시 0분)
   */
  @Cron('0 0 1 * *', {
    name: 'generate-monthly-code',
    timeZone: 'Asia/Seoul',
  })
  async autoGenerateMonthlyCode() {
    const code = await this.generateMonthlyCode();
    console.log(`✅ [CRON] 월별 가입코드 자동 생성 완료: ${code.code}`);
    return code;
  }

  /**
   * 월별 가입코드 생성 (수동/자동)
   * 포맷: YYYY-MM-XXXXXX (6자리 영숫자)
   */
  async generateMonthlyCode(maxUses: number | null = null): Promise<MonthlyCode> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthDate = new Date(`${year}-${month}-01`);

    // 6자리 랜덤 영숫자 생성
    const randomPart = this.generateRandomString(6);
    const code = `${year}-${month}-${randomPart}`;

    // 중복 체크
    const existing = await this.monthlyCodeRepository.findOne({ where: { code } });
    if (existing) {
      // 중복이면 재귀 호출
      return this.generateMonthlyCode(maxUses);
    }

    const monthlyCode = this.monthlyCodeRepository.create({
      code,
      month: monthDate,
      maxUses,
      usedCount: 0,
      isActive: true,
    });

    return this.monthlyCodeRepository.save(monthlyCode);
  }

  /**
   * 가입코드 검증 및 사용 카운트 증가
   */
  async validateAndUseCode(code: string): Promise<{ valid: boolean; message?: string; codeData?: MonthlyCode }> {
    const monthlyCode = await this.monthlyCodeRepository.findOne({ where: { code } });

    if (!monthlyCode) {
      return { valid: false, message: '존재하지 않는 코드입니다.' };
    }

    if (!monthlyCode.isActive) {
      return { valid: false, message: '비활성화된 코드입니다.' };
    }

    if (monthlyCode.maxUses !== null && monthlyCode.usedCount >= monthlyCode.maxUses) {
      return { valid: false, message: '사용 가능 횟수를 초과했습니다.' };
    }

    // 사용 카운트 증가
    monthlyCode.usedCount += 1;
    await this.monthlyCodeRepository.save(monthlyCode);

    return {
      valid: true,
      message: '유효한 코드입니다.',
      codeData: monthlyCode,
    };
  }

  /**
   * 모든 월별 코드 조회 (관리자용)
   */
  async findAll(limit: number = 50): Promise<MonthlyCode[]> {
    return this.monthlyCodeRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 특정 월의 활성 코드 조회
   */
  async findActiveByMonth(year: number, month: number): Promise<MonthlyCode[]> {
    const monthStr = String(month).padStart(2, '0');
    const monthDate = new Date(`${year}-${monthStr}-01`);

    return this.monthlyCodeRepository.find({
      where: {
        month: monthDate,
        isActive: true,
      },
    });
  }

  /**
   * 코드 활성화/비활성화 토글
   */
  async toggleActive(id: number): Promise<MonthlyCode> {
    const code = await this.monthlyCodeRepository.findOne({ where: { id } });
    if (!code) {
      throw new BadRequestException('코드를 찾을 수 없습니다.');
    }

    code.isActive = !code.isActive;
    return this.monthlyCodeRepository.save(code);
  }

  /**
   * 랜덤 영숫자 문자열 생성
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
