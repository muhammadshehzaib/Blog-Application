import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION = 'blogs';

export interface SearchHit {
  blogId: string;
  score: number;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private collectionReady = false;

  onModuleInit() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL ?? 'http://localhost:6333',
    });
  }

  /**
   * Mongo ObjectIds (24 hex chars) aren't valid Qdrant point IDs — Qdrant
   * wants an unsigned int or a UUID. We pad the 24-char hex to 32 and
   * format it as a UUID. Deterministic, so the same blog always maps to
   * the same point.
   */
  static pointId(objectId: string): string {
    const hex = objectId.padEnd(32, '0').slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16,
    )}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  private async ensureCollection(dim: number): Promise<boolean> {
    if (this.collectionReady) return true;
    try {
      const { collections } = await this.client.getCollections();
      const exists = collections.some((c) => c.name === COLLECTION);
      if (!exists) {
        await this.client.createCollection(COLLECTION, {
          vectors: { size: dim, distance: 'Cosine' },
        });
        this.logger.log(`created Qdrant collection "${COLLECTION}" dim=${dim}`);
      }
      this.collectionReady = true;
      return true;
    } catch (err) {
      this.logger.warn(
        `Qdrant ensureCollection failed: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async upsert(
    objectId: string,
    vector: number[],
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!(await this.ensureCollection(vector.length))) return;
    try {
      await this.client.upsert(COLLECTION, {
        points: [
          { id: QdrantService.pointId(objectId), vector, payload },
        ],
      });
    } catch (err) {
      this.logger.warn(`Qdrant upsert failed: ${(err as Error).message}`);
    }
  }

  async remove(objectId: string): Promise<void> {
    try {
      await this.client.delete(COLLECTION, {
        points: [QdrantService.pointId(objectId)],
      });
    } catch (err) {
      this.logger.warn(`Qdrant remove failed: ${(err as Error).message}`);
    }
  }

  async getVector(objectId: string): Promise<number[] | null> {
    try {
      const points = await this.client.retrieve(COLLECTION, {
        ids: [QdrantService.pointId(objectId)],
        with_vector: true,
      });
      const v = points[0]?.vector;
      return Array.isArray(v) ? (v as number[]) : null;
    } catch {
      return null;
    }
  }

  /** Find the K nearest blogs to a vector, excluding the blog itself. */
  async search(
    vector: number[],
    limit: number,
    excludeObjectId?: string,
  ): Promise<SearchHit[]> {
    if (!(await this.ensureCollection(vector.length))) return [];
    const excludeId = excludeObjectId
      ? QdrantService.pointId(excludeObjectId)
      : null;
    try {
      const results = await this.client.search(COLLECTION, {
        vector,
        limit: limit + (excludeId ? 1 : 0),
        with_payload: true,
      });
      return results
        .filter((r) => r.id !== excludeId)
        .slice(0, limit)
        .map((r) => ({
          blogId: String((r.payload as Record<string, unknown>)?.blogId ?? ''),
          score: r.score,
        }))
        .filter((h) => h.blogId);
    } catch (err) {
      this.logger.warn(`Qdrant search failed: ${(err as Error).message}`);
      return [];
    }
  }
}
