
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ProfilePrivate } from '../profiles-private/entities/profile-private.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { MonthlyCode } from '../codes/entities/monthly-code.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { Like } from '../match/entities/like.entity';
import { Match } from '../match/entities/match.entity';
import { Recommendation } from '../match/entities/recommendation.entity';
import { Message } from '../conversations/entities/message.entity';
import { Repository } from 'typeorm';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: Repository<User>;
  let matchRepository: Repository<Match>;
  let messageRepository: Repository<Message>;
  let likeRepository: Repository<Like>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Profile),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProfilePrivate),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Preference),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(MonthlyCode),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Referral),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Like),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Match),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Recommendation),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Message),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));
    messageRepository = module.get<Repository<Message>>(getRepositoryToken(Message));
    likeRepository = module.get<Repository<Like>>(getRepositoryToken(Like));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return KPI metrics', async () => {
      const userCount = 100;
      const matchCount = 50;
      const messageCount = 200;
      const likeCount = 500;
      const newUsersCount = 10;

      jest.spyOn(userRepository, 'count').mockResolvedValue(userCount);
      jest.spyOn(matchRepository, 'count').mockResolvedValue(matchCount);
      jest.spyOn(messageRepository, 'count').mockResolvedValue(messageCount);
      jest.spyOn(likeRepository, 'count').mockResolvedValue(likeCount);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(newUsersCount),
      } as any);

      const result = await service.getMetrics();

      expect(result).toEqual({
        totalUsers: userCount,
        totalMatches: matchCount,
        totalMessages: messageCount,
        totalLikes: likeCount,
        newUsersLast7Days: newUsersCount,
      });
    });
  });
});
