import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { Profile } from "./entities/profile.entity";
import { PhotoMeta } from "../photos/entities/photo-meta.entity";

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(PhotoMeta)
    private photoMetaRepository: Repository<PhotoMeta>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    userId: number,
    data: Partial<Profile>,
    token?: string,
  ): Promise<Profile> {
    const profile = this.profilesRepository.create({
      user_id: userId,
      ...data,
    });
    const savedProfile = await this.profilesRepository.save(profile);
    if (token) {
      this.triggerProfileAnalysis(token);
    }
    return savedProfile;
  }

  async update(
    userId: number,
    data: Partial<Profile>,
    token?: string,
  ): Promise<Profile> {
    await this.profilesRepository.update({ user_id: userId }, data);
    if (token) {
      this.triggerProfileAnalysis(token);
    }
    return this.findByUserId(userId);
  }

  async upsert(
    userId: number,
    data: Partial<Profile>,
    token?: string,
  ): Promise<Profile> {
    const existingProfile = await this.profilesRepository.findOne({
      where: { user_id: userId },
    });
    let result: Profile;
    if (existingProfile) {
      result = await this.update(userId, data, token);
    } else {
      result = await this.create(userId, data, token);
    }
    // The trigger is called within create/update, so no need to call it again here.
    return result;
  }

  async findByUserId(userId: number): Promise<any> {
    const profile = await this.profilesRepository.findOne({
      where: { user_id: userId },
      relations: ["user"],
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const photos = await this.photoMetaRepository.find({
      where: { uid: profile.user.uid },
    });

    return { ...profile, photos };
  }

  private triggerProfileAnalysis(token: string) {
    const url = this.configService.get("SUPABASE_FN_PROFILE_ANALYZER_URL");
    if (!url) {
      this.logger.warn(
        "SUPABASE_FN_PROFILE_ANALYZER_URL not set. Skipping AI analysis.",
      );
      return;
    }

    // Fire-and-forget
    firstValueFrom(
      this.httpService.post(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    )
      .then(() => {
        this.logger.log(`Successfully triggered profile analysis for user.`);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to trigger profile analysis: ${error.message}`,
          error.stack,
        );
      });
  }
}
