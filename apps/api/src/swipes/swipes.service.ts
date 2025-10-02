import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Swipe } from "./entities/swipe.entity";
import { MatchesService } from "../matches/matches.service";
import { StatisticsService } from "../statistics/statistics.service";

@Injectable()
export class SwipesService {
  constructor(
    @InjectRepository(Swipe)
    private swipesRepository: Repository<Swipe>,
    private readonly matchesService: MatchesService,
    private readonly statisticsService: StatisticsService,
  ) {}

  async create(
    actorId: number,
    targetId: number,
    action: "like" | "pass" | "superlike",
  ): Promise<{ swipe: Swipe; matched: boolean; matchId?: number }> {
    // Create swipe
    const swipe = this.swipesRepository.create({
      actor_id: actorId,
      target_id: targetId,
      action,
    });
    await this.swipesRepository.save(swipe);

    let matched = false;
    let matchId: number | undefined;

    if (action === "like") {
      const reciprocalSwipe = await this.swipesRepository.findOne({
        where: {
          actor_id: targetId,
          target_id: actorId,
          action: "like",
        },
      });

      if (reciprocalSwipe) {
        matched = true;
        const newMatch = await this.matchesService.create(actorId, targetId);
        matchId = newMatch.id;
        await this.statisticsService.incrementMatches();
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
