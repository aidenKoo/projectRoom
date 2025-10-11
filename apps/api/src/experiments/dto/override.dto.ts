import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class SetExperimentOverrideDto {
  @IsString()
  @MaxLength(40)
  experiment: string;

  @IsString()
  @MaxLength(20)
  variant: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  ttlSeconds?: number;
}
