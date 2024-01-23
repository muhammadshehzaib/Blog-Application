import { Injectable,NotFoundException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './schemas/blogs.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class BlogsService {
    constructor(@InjectModel(Blog.name)
    private blogsModel:mongoose.Model<Blog>
    ){}

    async findAll(): Promise<Blog[]> {
        const blog = await this.blogsModel.find();
        return blog;
      }
    
      async create(blog: Blog): Promise<Blog> {
        const res = await this.blogsModel.create(blog);
        console.log(res._id)
        return res;
      }
    
      async findById(id: string): Promise<Blog> {
        const blog = await this.blogsModel.findById(id);
    
        if (!blog) {
          throw new NotFoundException('Blog not found.');
        }
    
        return blog;
      }
    
      async updateById(id: string, blog: Blog): Promise<Blog> {
        return await this.blogsModel.findByIdAndUpdate(id, blog, {
          new: true,
          runValidators: true,
        });
      }
    
      async deleteById(id: string): Promise<Blog> {
        return await this.blogsModel.findByIdAndDelete(id);
      }
}
