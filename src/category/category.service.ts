import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsCategories } from './schemas/category.schema';
import * as mongoose from 'mongoose';
import { CacheService } from '../cache/cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';

const CATEGORY_TTL_SECONDS = 60 * 60;
const categoryKey = (id: string) => `category:${id}`;
const CATEGORIES_LIST_KEY = 'categories:list';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(BlogsCategories.name)
    private categoryModel: mongoose.Model<BlogsCategories>,
    private cache: CacheService,
  ) {}

  async findAll(): Promise<BlogsCategories[]> {
    const cached = await this.cache.get<BlogsCategories[]>(CATEGORIES_LIST_KEY);
    if (cached) return cached;

    const list = await this.categoryModel.find();
    await this.cache.set(CATEGORIES_LIST_KEY, list, CATEGORY_TTL_SECONDS);
    return list;
  }

  async create(category: CreateCategoryDto): Promise<BlogsCategories> {
    const created = await this.categoryModel.create(category);
    await this.cache.del(CATEGORIES_LIST_KEY);
    return created;
  }

  async findById(id: string): Promise<BlogsCategories> {
    const cached = await this.cache.get<BlogsCategories>(categoryKey(id));
    if (cached) return cached;

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    await this.cache.set(categoryKey(id), category, CATEGORY_TTL_SECONDS);
    return category;
  }

  async updateById(
    id: string,
    category: string | undefined,
  ): Promise<BlogsCategories> {
    if (!category) {
      throw new NotFoundException('Category name is required.');
    }
    const updated = await this.categoryModel.findByIdAndUpdate(
      id,
      { category },
      { new: true, runValidators: true },
    );
    await this.cache.del(categoryKey(id), CATEGORIES_LIST_KEY);
    return updated;
  }

  async deleteById(id: string): Promise<BlogsCategories> {
    const deleted = await this.categoryModel.findByIdAndDelete(id);
    await this.cache.del(categoryKey(id), CATEGORIES_LIST_KEY);
    return deleted;
  }
}
