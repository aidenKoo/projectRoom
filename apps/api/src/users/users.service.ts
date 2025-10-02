import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { SyncUserDto } from "./dto/sync-user.dto";
import { StatisticsService } from "../statistics/statistics.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly statisticsService: StatisticsService,
  ) {}

  async syncUser(firebaseUid: string, syncUserDto: SyncUserDto): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { firebase_uid: firebaseUid },
    });

    if (user) {
      // Update existing user
      await this.usersRepository.update(
        { firebase_uid: firebaseUid },
        syncUserDto,
      );
      user = await this.usersRepository.findOne({
        where: { firebase_uid: firebaseUid },
      });
    } else {
      // Create new user
      user = this.usersRepository.create({
        firebase_uid: firebaseUid,
        ...syncUserDto,
      });
      await this.usersRepository.save(user);
      await this.statisticsService.incrementSignups(); // Increment signups
    }

    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { firebase_uid: firebaseUid },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
