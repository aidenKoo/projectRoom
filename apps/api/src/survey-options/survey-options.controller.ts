import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SurveyOptionsService } from './survey-options.service';
import { CreateSurveyOptionDto } from './dto/create-survey-option.dto';
import { UpdateSurveyOptionDto } from './dto/update-survey-option.dto';
import { OptionCategory } from './entities/survey-option.entity';

@Controller('survey-options')
export class SurveyOptionsController {
  constructor(private readonly surveyOptionsService: SurveyOptionsService) {}

  @Post()
  // @UseGuards(AdminGuard) // Admin only
  create(@Body() createDto: CreateSurveyOptionDto) {
    return this.surveyOptionsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.surveyOptionsService.findAll();
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: OptionCategory) {
    return this.surveyOptionsService.findByCategory(category);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.surveyOptionsService.findOne(id);
  }

  @Put(':id')
  // @UseGuards(AdminGuard) // Admin only
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSurveyOptionDto,
  ) {
    return this.surveyOptionsService.update(id, updateDto);
  }

  @Delete(':id')
  // @UseGuards(AdminGuard) // Admin only
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveyOptionsService.remove(id);
  }

  @Patch(':id/toggle')
  // @UseGuards(AdminGuard) // Admin only
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.surveyOptionsService.toggleActive(id);
  }
}
