import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument, Status } from './schemas/blogs.schema';
import { Auth } from 'src/auth/schemas/auth.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private blogModel // private blogsModel:mongoose.Model<Blog>,
    : Model<BlogDocument>,
    private cloudinary: CloudinaryService,
  ) {}

  async findAll(): Promise<Blog[]> {
    const blog = await this.blogModel
      .find()
      .populate('category')
      .populate('comments')
      .populate('reactions');
    return blog;
  }

  async create(blog: CreateBlogDto): Promise<Blog> {
    const res = await this.blogModel.create(blog);
    return res;
  }

  async findById(id: string): Promise<Blog> {
    const blog = await this.blogModel
      .findById(id)
      .populate('category')
      .populate('comments')
      .populate('reactions');

    if (!blog) {
      throw new NotFoundException('Blog not found.');
    }

    return blog;
  }

  async find(blog: CreateBlogDto): Promise<Blog[]> {
    const res = await this.blogModel
      .find(blog)
      .populate('category')
      .populate('comments')
      .populate('reactions');

    console.log(res);

    return res;
  }

  async updateById(id: string, blog: UpdateBlogDto, req): Promise<Blog> {
    // console.log(blog);
    const blogId = await this.blogModel.findById(id);
    const userId = blogId.userId.toString();
    if (userId === req) {
      return await this.blogModel.findByIdAndUpdate(id, blog);
    }
    throw new NotFoundException('UserId not found.');
  }

  async deleteById(id: string, req): Promise<Blog> {
    const blogId = await this.blogModel.findById(id);
    const userId = blogId.userId.toString();
    if (userId === req) {
      return await this.blogModel.findByIdAndDelete(id);
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
    console.log(approvedblog);

    return approvedblog;
  }
  async findIdAndDisapproved(id: string, status: Status): Promise<Blog> {
    const filterQuery = { _id: id };

    const updateQuery = {
      status: Status.Disapproved,
      new: true,
      runValidators: true,
    };
    return await this.blogModel.findByIdAndUpdate(filterQuery, updateQuery);
  }

  // async uploadImageToCloudinary(file: Express.Multer.File) {

  // }
}
