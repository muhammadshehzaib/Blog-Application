import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsCategories } from './schemas/category.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(BlogsCategories.name)
    private categoryModel: mongoose.Model<BlogsCategories>,
  ) {}

  async findAll(): Promise<BlogsCategories[]> {
    const category = await this.categoryModel.find();
    return category;
  }

  async create(category: BlogsCategories): Promise<BlogsCategories> {
    try {
      const res = await this.categoryModel.create(category);
      console.log(res);
      return res;
    } catch (e) {
      console.error('User cannot create Category');
    }
  }

  async findById(id: string): Promise<BlogsCategories> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Blog not found.');
    }

    return category;
  }

  async updateById(
    id: string,
    category: BlogsCategories,
  ): Promise<BlogsCategories> {
    return await this.categoryModel.findByIdAndUpdate(id, category, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<BlogsCategories> {
    return await this.categoryModel.findByIdAndDelete(id);
  }
}
