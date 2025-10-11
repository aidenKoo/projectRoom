import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { PhotoModerationService } from "./photo-moderation.service";
import { PhotoMeta, PhotoModerationStatus } from "./entities/photo-meta.entity";

describe("PhotoModerationService", () => {
  let service: PhotoModerationService;
  let repo: Repository<PhotoMeta>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoModerationService,
        { provide: getRepositoryToken(PhotoMeta), useClass: Repository },
        { provide: HttpService, useValue: { post: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(PhotoModerationService);
    repo = module.get(getRepositoryToken(PhotoMeta));
  });

  it("approves safe content and updates hash when provided", async () => {
    const existing: Partial<PhotoMeta> = {
      id: 1,
      photoId: 2,
      userId: 3,
      status: PhotoModerationStatus.PENDING,
      nsfw: false,
      hash: undefined,
    };

    jest.spyOn(repo, "findOne").mockResolvedValue(existing as PhotoMeta);
    jest.spyOn(repo, "save").mockImplementation(async (meta: PhotoMeta) => meta);

    const updated = await service.handleAutoModerationResult(
      1,
      { flagged: false, confidence: 0.01, reasons: [], severity: "low" },
      "abc123",
    );

    expect(updated.status).toBe(PhotoModerationStatus.APPROVED);
    expect(updated.hash).toBe("abc123");
    expect(updated.nsfw).toBe(false);
  });

  it("auto-flags NSFW content and persists labels/score", async () => {
    const existing: Partial<PhotoMeta> = {
      id: 2,
      photoId: 4,
      userId: 5,
      status: PhotoModerationStatus.PENDING,
      nsfw: false,
    };

    const repoSave = jest
      .spyOn(repo, "save")
      .mockImplementation(async (meta: PhotoMeta) => meta);
    jest.spyOn(repo, "findOne").mockResolvedValue(existing as PhotoMeta);

    const updated = await service.handleAutoModerationResult(
      2,
      { flagged: true, confidence: 0.92, reasons: ["nsfw"], severity: "high" },
    );

    expect(repoSave).toHaveBeenCalled();
    expect(updated.status).toBe(PhotoModerationStatus.AUTO_FLAGGED);
    expect(updated.nsfw).toBe(true);
    expect(updated.nsfwScore).toBe(0.92);
    expect(updated.labels).toEqual([
      { provider: "supabase_claude", label: "nsfw", score: 0.92 },
    ]);
  });
});
