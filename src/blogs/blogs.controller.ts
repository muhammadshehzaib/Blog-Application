import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
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

@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Get('admin')
  @UseGuards(AuthGuard('jwt'))
  async getAllAdminBlogs(): Promise<Blog[]> {
    return this.blogsService.findAll();
  }

  @Get()
  async getAllBlogs(): Promise<Blog[]> {
    return this.blogsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Writer)
  async createBlogs(
    @Req() req: any,
    @Body()
    blog: CreateBlogDto,
  ): Promise<Blog> {
    const userId = req.user.id;
    return this.blogsService.create({ ...blog, userId: userId });
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
    @Body() // @Req()
    // req: any,
    blog: UpdateBlogDto,
  ): Promise<Blog> {
    // console.log(req);

    return this.blogsService.updateById(id, blog);
  }

  @Post('approved/:id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.Admin)
  async approvedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndApproved(id, status);
  }

  @Post('disapproved/:id')
  @UseGuards(AuthGuard('jwt'))
  async disApprovedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndDisapproved(id, status);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteBlogs(
    @Param('id')
    id: string,
  ): Promise<Blog> {
    return this.blogsService.deleteById(id);
  }
}
