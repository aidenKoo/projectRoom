import { PhotoModerationService } from "./photo-moderation.service";
import { Photo } from "./entities/photo.entity";
import {
  PhotoMeta,
  PhotoModerationStatus,
} from "./entities/photo-meta.entity";

class InMemoryPhotoMetaRepository {
  private store: PhotoMeta[] = [];
  private idCounter = 1;

  create(data: Partial<PhotoMeta>): PhotoMeta {
    return Object.assign(new PhotoMeta(), data);
  }

  async findOne(options: any): Promise<PhotoMeta | null> {
    if (options?.where?.photoId !== undefined) {
      return (
        this.store.find((meta) => meta.photoId === options.where.photoId) ?? null
      );
    }
    if (options?.where?.id !== undefined) {
      return this.store.find((meta) => meta.id === options.where.id) ?? null;
    }
    return null;
  }

  async save(meta: PhotoMeta): Promise<PhotoMeta> {
    if (!meta.id) {
      meta.id = this.idCounter++;
      this.store.push(meta);
    } else {
      const idx = this.store.findIndex((entry) => entry.id === meta.id);
      if (idx >= 0) {
        this.store[idx] = meta;
      } else {
        this.store.push(meta);
      }
    }
    return meta;
  }
}

describe("Photo moderation pipeline", () => {
  const repo = new InMemoryPhotoMetaRepository();
  const httpServiceMock = { post: jest.fn() } as any;
  const configServiceMock = { get: jest.fn(() => undefined) } as any;
  const service = new PhotoModerationService(
    repo as any,
    httpServiceMock,
    configServiceMock,
  );

  it("runs upload → auto moderation result → approval", async () => {
    const photo = Object.assign(new Photo(), {
      id: 10,
      objectPath: "users/u/photos/test.jpg",
    });

    const meta = await service.upsertMeta(1, photo, {
      width: 640,
      height: 480,
      bytes: 123456,
      hash: "hash-initial",
    });

    expect(meta.status).toBe(PhotoModerationStatus.PENDING);

    await service.handleAutoModerationResult(meta.id, {
      flagged: false,
      confidence: 0.98,
      reasons: [],
      severity: "low",
    });

    const updated = await service.getMetaById(meta.id);
    expect(updated?.status).toBe(PhotoModerationStatus.APPROVED);
    expect(updated?.nsfw).toBe(false);
  });

  it("marks conversion to auto-flagged when flagged", async () => {
    const photo = Object.assign(new Photo(), {
      id: 20,
      objectPath: "users/u/photos/nsfw.jpg",
    });

    const meta = await service.upsertMeta(2, photo, {});

    await service.handleAutoModerationResult(meta.id, {
      flagged: true,
      confidence: 0.87,
      reasons: ["nsfw"],
      severity: "high",
    });

    const updated = await service.getMetaById(meta.id);
    expect(updated?.status).toBe(PhotoModerationStatus.AUTO_FLAGGED);
    expect(updated?.nsfw).toBe(true);
    expect(updated?.labels).toEqual([
      { provider: "supabase_claude", label: "nsfw", score: 0.87 },
    ]);
  });
});
