import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CodesController } from "./codes.controller";
import { CodesService } from "./codes.service";
import { MonthlyCode } from "./entities/monthly-code.entity";

@Module({
  imports: [TypeOrmModule.forFeature([MonthlyCode])],
  controllers: [CodesController],
  providers: [CodesService],
  exports: [CodesService],
})
export class CodesModule {}
