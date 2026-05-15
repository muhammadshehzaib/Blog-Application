import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsCategories } from './schemas/category.schema';
import * as mongoose from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(BlogsCategories.name)
    private categoryModel: mongoose.Model<BlogsCategories>,
  ) {}

  async findAll(): Promise<BlogsCategories[]> {
    return this.categoryModel.find();
  }

  async create(category: CreateCategoryDto): Promise<BlogsCategories> {
    return this.categoryModel.create(category);
  }

  async findById(id: string): Promise<BlogsCategories> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }

  async updateById(
    id: string,
    category: string | undefined,
  ): Promise<BlogsCategories> {
    if (!category) {
      throw new NotFoundException('Category name is required.');
    }
    return this.categoryModel.findByIdAndUpdate(
      id,
      { category },
      { new: true, runValidators: true },
    );
  }

  async deleteById(id: string): Promise<BlogsCategories> {
    return this.categoryModel.findByIdAndDelete(id);
  }
}
