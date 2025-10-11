import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ExperimentsService } from "./experiments.service";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { AbEvent } from "./entities/ab-event.entity";
import { AbExperiment } from "./entities/ab-experiment.entity";
import { AbExperimentSnapshot } from "./entities/ab-experiment-snapshot.entity";
import { AbExperimentConfigHistory } from "./entities/ab-experiment-config-history.entity";
import { RedisService } from "../common/cache/redis.service";

describe("ExperimentsService", () => {
  let service: ExperimentsService;
  let assignmentRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let experimentRepo: { findOne: jest.Mock };
  let snapshotRepo: { upsert: jest.Mock; createQueryBuilder: jest.Mock; getMany: jest.Mock };
  let historyRepo: { save: jest.Mock; create: jest.Mock };
  let redisService: {
    keys: jest.Mock;
    getJson: jest.Mock;
    setJson: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    assignmentRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (v) => v),
      create: jest.fn((v) => v),
    };

    const eventRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    experimentRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    } as any;

    snapshotRepo = (() => {
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      return {
        upsert: jest.fn(),
        createQueryBuilder: jest.fn(() => qb),
      } as any;
    })();

    historyRepo = {
      save: jest.fn(async (v) => v),
      create: jest.fn((v) => v),
    };

    redisService = {
      keys: jest.fn().mockResolvedValue([]),
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        { provide: getRepositoryToken(AbAssignment), useValue: assignmentRepo },
        { provide: getRepositoryToken(AbEvent), useValue: eventRepo },
        { provide: getRepositoryToken(AbExperiment), useValue: experimentRepo },
        { provide: getRepositoryToken(AbExperimentSnapshot), useValue: snapshotRepo },
        { provide: getRepositoryToken(AbExperimentConfigHistory), useValue: historyRepo },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(ExperimentsService);
  });

  it("assigns deterministically for same user/experiment", async () => {
    const a1 = await service.getOrAssign(123, "expX", ["A", "B"], {});
    const a2 = await service.getOrAssign(123, "expX", ["A", "B"], {});

    expect(a1.variant).toBe(a2.variant);
    expect(assignmentRepo.create).toHaveBeenCalled();
  });

  it("respects overrides when configured", async () => {
    redisService.getJson.mockResolvedValueOnce({ variant: "B" });

    const assignment = await service.getOrAssign(1, "expOverride", ["A", "B"], {});

    expect(assignment.variant).toBe("B");
    expect(redisService.getJson).toHaveBeenCalled();
  });

  it("records history entries", async () => {
    await service.recordHistory({
      experiment: "expHistory",
      changeType: "config",
      payload: { foo: "bar" },
      actor: "admin",
      reason: "test",
    });

    expect(historyRepo.create).toHaveBeenCalled();
    expect(historyRepo.save).toHaveBeenCalled();
  });
});
