import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async findByUserId(userId: number): Promise<Match[]> {
    return this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.userA', 'userA')
      .leftJoinAndSelect('match.userB', 'userB')
      .where(
        '(match.user_a = :userId OR match.user_b = :userId) AND match.status = :status',
        { userId, status: 'active' },
      )
      .orderBy('match.created_at', 'DESC')
      .getMany();
  }

  async findById(matchId: number, userId: number): Promise<Match | null> {
    return this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.userA', 'userA')
      .leftJoinAndSelect('match.userB', 'userB')
      .where('match.id = :matchId', { matchId })
      .andWhere('(match.user_a = :userId OR match.user_b = :userId)', {
        userId,
      })
      .getOne();
  }
}
