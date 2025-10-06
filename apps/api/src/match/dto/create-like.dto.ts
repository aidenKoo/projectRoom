import { Expose } from "class-transformer";
import { IsString } from "class-validator";

export class CreateLikeDto {
  @Expose({ name: "target_id" })
  @IsString()
  targetUserId: string;
}
