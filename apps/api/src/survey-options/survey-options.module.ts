import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyOptionsController } from './survey-options.controller';
import { SurveyOptionsService } from './survey-options.service';
import { SurveyOption } from './entities/survey-option.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyOption])],
  controllers: [SurveyOptionsController],
  providers: [SurveyOptionsService],
  exports: [SurveyOptionsService],
})
export class SurveyOptionsModule {}
