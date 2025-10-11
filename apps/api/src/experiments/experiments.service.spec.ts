import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExperimentsService } from "./experiments.service";
import { AbAssignment } from "./entities/ab-assignment.entity";

describe("ExperimentsService", () => {
  let service: ExperimentsService;
  let repo: Repository<AbAssignment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        { provide: getRepositoryToken(AbAssignment), useClass: Repository },
      ],
    }).compile();

    service = module.get(ExperimentsService);
    repo = module.get(getRepositoryToken(AbAssignment));
  });

  it("assigns deterministically for same user/experiment", async () => {
    jest.spyOn(repo, "findOne").mockResolvedValue(null as any);
    jest.spyOn(repo, "save").mockImplementation(async (v: any) => v);
    jest.spyOn(repo, "create").mockImplementation((v: any) => v as any);

    const a1 = await service.getOrAssign(123, "expX", ["A", "B"]);
    const a2 = await service.getOrAssign(123, "expX", ["A", "B"]);

    expect(a1.variant).toBe(a2.variant);
  });
});

