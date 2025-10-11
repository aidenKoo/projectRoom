import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class GetAssignmentQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  experiment: string;

  @IsOptional()
  @IsArray()
  variants?: string[]; // e.g., ["A","B"]
}

export class ForceAssignDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  experiment: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  variant: string;
}

export class ListAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  experiment?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

