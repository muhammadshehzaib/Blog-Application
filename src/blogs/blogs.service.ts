import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiService } from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';
import { BlogsCategories } from '../category/schemas/category.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { QdrantService } from '../search/qdrant.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Blog, BlogDocument, Status } from './schemas/blogs.schema';

const BLOG_TTL_SECONDS = 5 * 60;
const BLOGS_LIST_TTL_SECONDS = 60;
const AI_RESULT_TTL_SECONDS = 24 * 60 * 60;

// Reindex tuning — keeps a bulk reindex under provider rate limits.
const REINDEX_DELAY_MS = 150; // pause between blogs
const REINDEX_MAX_ATTEMPTS = 3; // tries per blog before giving up
const REINDEX_BACKOFF_MS = 1500; // base wait between retries (×attempt)

const blogKey = (id: string) => `blog:${id}`;
const summaryKey = (id: string) => `blog:summary:${id}`;
const autoTagKey = (id: string) => `blog:autotag:${id}`;
const relatedKey = (id: string) => `blog:related:${id}`;
const BLOGS_LIST_KEY = 'blogs:list:all';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
    @InjectModel(BlogsCategories.name)
    private categoryModel: Model<BlogsCategories>,
    private cloudinary: CloudinaryService,
    private cache: CacheService,
    private ai: AiService,
    private qdrant: QdrantService,
  ) {}

  private blogText(blog: { title: string; content: string }): string {
    return `${blog.title}\n\n${blog.content}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Embed a blog and store its vector in Qdrant.
   * Returns true on success. May throw — callers decide how to handle it.
   */
  private async embedAndStore(blog: BlogDocument): Promise<boolean> {
    const vector = await this.ai.embed(this.blogText(blog));
    if (vector.length === 0) return false;
    await this.qdrant.upsert(String(blog._id), vector, {
      blogId: String(blog._id),
      title: blog.title,
    });
    return true;
  }

  /**
   * Fire-and-forget indexing for blog writes. Non-fatal: if embedding or
   * Qdrant fails, the blog still exists — it just won't appear in
   * recommendations until the next reindex.
   */
  private async indexBlog(blog: BlogDocument): Promise<void> {
    try {
      await this.embedAndStore(blog);
    } catch {
      /* swallow — indexing failure must not break blog writes */
    }
  }

  async related(
    id: string,
    limit = 5,
  ): Promise<{ related: Blog[]; cached: boolean }> {
    const cached = await this.cache.get<{ related: Blog[] }>(relatedKey(id));
    if (cached) return { ...cached, cached: true };

    const blog = await this.blogModel.findById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    // Get this blog's vector. If it was never indexed (older blog),
    // embed it now and store it so next time it's already there.
    let vector = await this.qdrant.getVector(id);
    if (!vector) {
      vector = await this.ai.embed(this.blogText(blog));
      await this.qdrant.upsert(id, vector, {
        blogId: id,
        title: blog.title,
      });
    }

    const hits = await this.qdrant.search(vector, limit, id);
    const ids = hits.map((h) => h.blogId);

    // $in doesn't preserve order — re-sort to match similarity ranking.
    const found = await this.blogModel
      .find({ _id: { $in: ids } })
      .populate('category');
    const byId = new Map(found.map((b) => [String(b._id), b]));
    const related = ids
      .map((bid) => byId.get(bid))
      .filter((b) => Boolean(b)) as Blog[];

    const result = { related };
    await this.cache.set(relatedKey(id), result, AI_RESULT_TTL_SECONDS);
    return { ...result, cached: false };
  }

  /**
   * Embed every existing blog into Qdrant — run once to backfill older posts.
   *
   * Throttled and retry-aware so a bulk run survives provider rate limits:
   * each blog gets up to REINDEX_MAX_ATTEMPTS tries with linear backoff, and
   * there is a short pause between blogs. Returns an honest tally.
   */
  async reindexAll(
    onProgress?: (done: number, total: number) => void,
  ): Promise<{
    total: number;
    indexed: number;
    failed: number;
    skipped: number;
  }> {
    const blogs = await this.blogModel.find();
    let indexed = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < blogs.length; i++) {
      const blog = blogs[i];

      // Skip if this blog is already in Qdrant — avoids re-burning quota
      // on a partial reindex retry.
      const existing = await this.qdrant.getVector(String(blog._id));
      if (existing) {
        skipped++;
        onProgress?.(i + 1, blogs.length);
        continue;
      }

      let ok = false;
      for (let attempt = 1; attempt <= REINDEX_MAX_ATTEMPTS; attempt++) {
        try {
          ok = await this.embedAndStore(blog);
          if (ok) break;
        } catch {
          /* fall through to retry */
        }
        if (attempt < REINDEX_MAX_ATTEMPTS) {
          await this.sleep(REINDEX_BACKOFF_MS * attempt);
        }
      }
      ok ? indexed++ : failed++;
      onProgress?.(i + 1, blogs.length);
      await this.sleep(REINDEX_DELAY_MS);
    }

    return { total: blogs.length, indexed, failed, skipped };
  }

  async summarize(id: string): Promise<{ summary: string; cached: boolean }> {
    const cached = await this.cache.get<{ summary: string }>(summaryKey(id));
    if (cached) return { ...cached, cached: true };

    const blog = await this.blogModel.findById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    const summary = await this.ai.summarize(blog.title, blog.content);
    const result = { summary };
    await this.cache.set(summaryKey(id), result, AI_RESULT_TTL_SECONDS);
    return { ...result, cached: false };
  }

  async autoTag(
    id: string,
  ): Promise<{ suggestions: string[]; cached: boolean }> {
    const cached = await this.cache.get<{ suggestions: string[] }>(
      autoTagKey(id),
    );
    if (cached) return { ...cached, cached: true };

    const blog = await this.blogModel.findById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    const categories = await this.categoryModel.find();
    const names = categories
      .map((c) => (c as any).category)
      .filter(Boolean);

    const suggestions = await this.ai.suggestTags(
      blog.title,
      blog.content,
      names,
    );
    const result = { suggestions };
    await this.cache.set(autoTagKey(id), result, AI_RESULT_TTL_SECONDS);
    return { ...result, cached: false };
  }

  async findAll(): Promise<Blog[]> {
    const cached = await this.cache.get<Blog[]>(BLOGS_LIST_KEY);
    if (cached) return cached;

    const blog = await this.blogModel
      .find()
      .populate('category')
      .populate('comments')
      .populate('reactions');

    await this.cache.set(BLOGS_LIST_KEY, blog, BLOGS_LIST_TTL_SECONDS);
    return blog;
  }

  async findPaginated(opts: {
    page?: number;
    limit?: number;
    category?: string;
    q?: string;
  }): Promise<{
    items: Blog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 12));
    const skip = (page - 1) * limit;
    const category = opts.category?.trim() || '';
    const q = opts.q?.trim() || '';

    const cacheKey = `blogs:list:p${page}:l${limit}:c${category || '*'}:q${q || '*'}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const filter: Record<string, any> = {};

    if (category) {
      const cat = await this.categoryModel.findOne({ category });
      if (!cat) {
        const empty = { items: [], total: 0, page, limit, totalPages: 0 };
        await this.cache.set(cacheKey, empty, BLOGS_LIST_TTL_SECONDS);
        return empty;
      }
      filter.category = cat._id;
    }

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { content: { $regex: safe, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category')
        .populate('comments')
        .populate('reactions'),
      this.blogModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const payload = { items, total, page, limit, totalPages };
    await this.cache.set(cacheKey, payload, BLOGS_LIST_TTL_SECONDS);
    return payload;
  }

  async create(
    blog: CreateBlogDto & { image: string; userId: string },
  ): Promise<Blog> {
    const isValid = mongoose.isValidObjectId(blog.category);
    if (!isValid) {
      throw new BadRequestException('Incorrect Object Id');
    }
    const category = await this.categoryModel.findById(blog.category);
    if (!category) {
      throw new NotFoundException('Not found category');
    }
    const res = await this.blogModel.create(blog);
    await this.cache.del(BLOGS_LIST_KEY);
    await this.indexBlog(res);
    return res;
  }

  async findById(id: string): Promise<any> {
    const cached = await this.cache.get<Blog>(blogKey(id));
    if (cached) return cached;

    const blog = await this.blogModel
      .findById(id)
      .populate('category')
      .populate('comments')
      .populate('reactions');

    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    await this.cache.set(blogKey(id), blog, BLOG_TTL_SECONDS);
    return blog;
  }

  async find(query: Record<string, any>): Promise<Blog[]> {
    const res = await this.blogModel
      .find(query)
      .populate('category')
      .populate('comments')
      .populate('reactions');

    return res;
  }

  async updateById(id: string, blog: UpdateBlogDto, req): Promise<Blog> {
    const blogId = await this.blogModel.findById(id);
    const userId = blogId.userId.toString();
    if (userId === req) {
      const updated = await this.blogModel.findByIdAndUpdate(id, blog);
      await this.cache.del(
        blogKey(id),
        summaryKey(id),
        autoTagKey(id),
        relatedKey(id),
        BLOGS_LIST_KEY,
      );
      // content changed → re-embed so recommendations stay accurate
      const fresh = await this.blogModel.findById(id);
      if (fresh) await this.indexBlog(fresh);
      return updated;
    }
    throw new NotFoundException('UserId not found.');
  }

  async deleteById(id: string, req): Promise<Blog> {
    const blogId = await this.blogModel.findById(id);
    const userId = blogId.userId.toString();
    if (userId === req) {
      const deleted = await this.blogModel.findByIdAndDelete(id);
      await this.cache.del(
        blogKey(id),
        summaryKey(id),
        autoTagKey(id),
        relatedKey(id),
        BLOGS_LIST_KEY,
      );
      await this.qdrant.remove(id);
      return deleted;
    }
    throw new NotFoundException('UserId not found.');
  }
  async findIdAndApproved(id: string, status: Status): Promise<Blog> {
    const filterQuery = { _id: id };
    const updateQuery = {
      status: Status.Approved,
      new: true,
      runValidators: true,
    };
    const approvedblog = await this.blogModel.findOneAndUpdate(
      filterQuery,
      updateQuery,
    );
    await this.cache.del(blogKey(id), BLOGS_LIST_KEY);

    return approvedblog;
  }
  async findIdAndDisapproved(id: string, status: Status): Promise<Blog> {
    const filterQuery = { _id: id };

    const updateQuery = {
      status: Status.Disapproved,
      new: true,
      runValidators: true,
    };
    const updated = await this.blogModel.findByIdAndUpdate(
      filterQuery,
      updateQuery,
    );
    await this.cache.del(blogKey(id), BLOGS_LIST_KEY);
    return updated;
  }
}
