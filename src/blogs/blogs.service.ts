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
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Blog, BlogDocument, Status } from './schemas/blogs.schema';

const BLOG_TTL_SECONDS = 5 * 60;
const BLOGS_LIST_TTL_SECONDS = 60;
const AI_RESULT_TTL_SECONDS = 24 * 60 * 60;

const blogKey = (id: string) => `blog:${id}`;
const summaryKey = (id: string) => `blog:summary:${id}`;
const autoTagKey = (id: string) => `blog:autotag:${id}`;
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
  ) {}

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
        BLOGS_LIST_KEY,
      );
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
        BLOGS_LIST_KEY,
      );
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
