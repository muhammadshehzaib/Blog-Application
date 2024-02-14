import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { AuthGuard } from '../auth/auth.guard';
import { BlogsService } from './blogs.service';
import { Blog, Status } from './schemas/blogs.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Roles } from 'src/roles';
import { RolesGuard } from 'src/role.guard';
import { Auth, Role } from 'src/auth/schemas/auth.schema';
import { AuthGuard } from '@nestjs/passport';
import { Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import mongoose from 'mongoose';
import { CategorySchema } from 'src/category/schemas/category.schema';
import { CategoryService } from 'src/category/category.service';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';
@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private cloudinary: CloudinaryService,
  ) {}

  @Get('admin')
  @UseGuards(AuthGuard('jwt'))
  async getAllAdminBlogs(): Promise<Blog[]> {
    return this.blogsService.findAll();
  }

  @Get()
  async getAllBlogs(): Promise<any> {
    return this.blogsService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async createBlogs(
    @Req() req: any,
    @Body()
    blog: CreateBlogDto,
    @UploadedFile() file,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Blog> {
    try {
      let myfile: Express.Multer.File;
      if (file) {
        const userId = req.user.id;
        myfile = file.buffer;
        const image = await this.cloudinary.uploadImage(myfile);
        const secure_url = image.secure_url;

        return this.blogsService.create({
          ...blog,
          image: secure_url,
          userId,
        });
      }
    } catch (error) {
      console.error('Blog cannot be created from backend' + error);
    }
  }

  @Get('userblogs')
  @UseGuards(AuthGuard('jwt'))
  async getAllWriterBlogs(
    @Req()
    req: any,
    blog: CreateBlogDto,
  ): Promise<Blog[]> {
    const userId = req.user.id;
    return this.blogsService.find({ ...blog, userId: userId });
  }

  @Get(':id')
  async getBlogs(
    @Param('id')
    id: string,
  ): Promise<Blog> {
    return this.blogsService.findById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async updateBlogs(
    @Param('id')
    id: string,
    @Req()
    req: any,
    @Body()
    blog: UpdateBlogDto,
  ): Promise<Blog> {
    const userId = req.user._id.toString();
    return this.blogsService.updateById(id, blog, userId);
  }
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteBlogs(
    @Req()
    req: any,
    @Param('id')
    id: string,
  ): Promise<Blog> {
    const userId = req.user._id.toString();
    return this.blogsService.deleteById(id, userId);
  }

  @Put('approved/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.Admin)
  async approvedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndApproved(id, status);
  }

  @Put('disapproved/:id')
  @UseGuards(AuthGuard('jwt'))
  async disApprovedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndDisapproved(id, status);
  }
}
