import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { CodesService } from "./codes.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Codes")
@Controller("codes")
export class CodesController {
  constructor(private readonly codesService: CodesService) {}

  /**
   * POST /codes/validate
   * 가입코드 검증 (회원가입 시 사용)
   */
  @Post("validate")
  @HttpCode(200)
  @ApiOperation({ summary: "가입코드 검증 및 사용" })
  @ApiResponse({ status: 200, description: "코드 검증 결과 반환" })
  async validateCode(@Body("code") code: string) {
    return this.codesService.validateAndUseCode(code);
  }

  /**
   * GET /codes
   * 모든 월별 코드 조회 (관리자용)
   */
  @Get()
  @ApiOperation({ summary: "모든 월별 코드 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "월별 코드 목록 반환" })
  async findAll(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.codesService.findAll(limitNum);
  }

  /**
   * POST /codes/generate
   * 월별 코드 수동 생성 (관리자용)
   */
  @Post("generate")
  @ApiOperation({ summary: "월별 코드 수동 생성 (관리자)" })
  @ApiResponse({ status: 201, description: "생성된 코드 반환" })
  async generateCode(@Body("maxUses") maxUses?: number) {
    return this.codesService.generateMonthlyCode(maxUses || null);
  }

  /**
   * POST /codes/:id/toggle
   * 코드 활성화/비활성화 토글 (관리자용)
   */
  @Post(":id/toggle")
  @ApiOperation({ summary: "코드 활성화/비활성화 토글 (관리자)" })
  @ApiResponse({ status: 200, description: "업데이트된 코드 반환" })
  async toggleActive(@Param("id") id: string) {
    return this.codesService.toggleActive(parseInt(id, 10));
  }

  /**
   * GET /codes/month/:year/:month
   * 특정 월의 활성 코드 조회 (관리자용)
   */
  @Get("month/:year/:month")
  @ApiOperation({ summary: "특정 월의 활성 코드 조회 (관리자)" })
  @ApiResponse({ status: 200, description: "해당 월의 활성 코드 목록" })
  async findByMonth(
    @Param("year") year: string,
    @Param("month") month: string,
  ) {
    return this.codesService.findActiveByMonth(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }
}
