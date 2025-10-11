import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ExperimentsService } from "./experiments.service";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { AbEvent } from "./entities/ab-event.entity";
import { AbExperiment } from "./entities/ab-experiment.entity";

describe("ExperimentsService", () => {
  let service: ExperimentsService;
  let assignmentRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let experimentRepo: { findOne: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        { provide: getRepositoryToken(AbAssignment), useValue: assignmentRepo },
        { provide: getRepositoryToken(AbEvent), useValue: eventRepo },
        { provide: getRepositoryToken(AbExperiment), useValue: experimentRepo },
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
});
