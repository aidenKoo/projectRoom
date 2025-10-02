import { PartialType } from '@nestjs/swagger';
import { CreateProfilePrivateDto } from './create-profile-private.dto';

export class UpdateProfilePrivateDto extends PartialType(CreateProfilePrivateDto) {}
