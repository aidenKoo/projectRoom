import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyOptionDto } from './create-survey-option.dto';

export class UpdateSurveyOptionDto extends PartialType(CreateSurveyOptionDto) {}
