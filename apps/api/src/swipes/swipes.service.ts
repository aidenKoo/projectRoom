import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swipe } from './entities/swipe.entity';

@Injectable()
export class SwipesService {
  constructor(
    @InjectRepository(Swipe)
    private swipesRepository: Repository<Swipe>,
  ) {}

  async create(
    actorId: number,
    targetId: number,
    action: 'like' | 'pass' | 'superlike',
  ): Promise<{ swipe: Swipe; matched: boolean; matchId?: number }> {
    // Create swipe
    const swipe = this.swipesRepository.create({
      actor_id: actorId,
      target_id: targetId,
      action,
    });
    await this.swipesRepository.save(swipe);

    // Check for mutual like (match will be created by trigger)
    let matched = false;
    let matchId: number | undefined;

    if (action === 'like') {
      const reciprocalSwipe = await this.swipesRepository.findOne({
        where: {
          actor_id: targetId,
          target_id: actorId,
          action: 'like',
        },
      });

      if (reciprocalSwipe) {
        matched = true;
        // Match is created by DB trigger, we'd need to query it
        // For now, return matched: true
      }
    }

    return { swipe, matched, matchId };
  }

  async hasUserSwiped(actorId: number, targetId: number): Promise<boolean> {
    const swipe = await this.swipesRepository.findOne({
      where: { actor_id: actorId, target_id: targetId },
    });
    return !!swipe;
  }
}
