import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument, Status } from './schemas/blogs.schema';
@Injectable()
export class BlogsService {
    constructor(@InjectModel(Blog.name)
    // private blogsModel:mongoose.Model<Blog>,
    private blogModel: Model<BlogDocument>
    ){}

    async findAll(): Promise<Blog[]> {
        const blog = await this.blogModel.find().populate('category');
        return blog;
      }
    
      async create(blog: Blog): Promise<Blog> {
        const res = await this.blogModel.create(blog);
        console.log(res._id)
        return res;
      }
    
      async findById(id: string): Promise<Blog> {
        const blog = await this.blogModel.findById(id);
    
        if (!blog) {
          throw new NotFoundException('Blog not found.');
        }
    
        return blog;
      }
    
      async updateById(id: string, blog: Blog): Promise<Blog> {
        return await this.blogModel.findByIdAndUpdate(id, blog, {
          new: true,
          runValidators: true,
        });
      }
      async findIdAndApproved(id:string,status:Status):Promise<Blog>{
        const filterQuery = { _id: id };
        const updateQuery = { status: Status.Approved, new: true, runValidators: true };
        return await this.blogModel.findByIdAndUpdate(filterQuery, updateQuery);
      }
      async findIdAndDisapproved(id:string,status:Status):Promise<Blog>{
        const filterQuery = { _id: id };

        const updateQuery = { status: Status.Disapproved, new: true, runValidators: true };
        return await this.blogModel.findByIdAndUpdate(filterQuery, updateQuery);
      }
      
    
      async deleteById(id: string): Promise<Blog> {
        return await this.blogModel.findByIdAndDelete(id);
      }
}
