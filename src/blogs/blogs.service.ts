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
        const contact = await this.blogsModel.find();
        return contact;
      }
    
      async create(contact: Blog): Promise<Blog> {
        const res = await this.blogsModel.create(contact);
        return res;
      }
    
      async findById(id: string): Promise<Blog> {
        const contact = await this.blogsModel.findById(id);
    
        if (!contact) {
          throw new NotFoundException('Blog not found.');
        }
    
        return contact;
      }
    
      async updateById(id: string, contact: Blog): Promise<Blog> {
        return await this.blogsModel.findByIdAndUpdate(id, contact, {
          new: true,
          runValidators: true,
        });
      }
    
      async deleteById(id: string): Promise<Blog> {
        return await this.blogsModel.findByIdAndDelete(id);
      }
}
