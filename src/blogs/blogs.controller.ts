import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
// import { AuthGuard } from '../auth/auth.guard';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { Role } from '../auth/schemas/auth.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RolesGuard } from '../role.guard';
import { Roles } from '../roles';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { REINDEX_JOB, REINDEX_QUEUE } from './reindex.processor';
import { Blog, Status } from './schemas/blogs.schema';
@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogsService,
    private cloudinary: CloudinaryService,
    @InjectQueue(REINDEX_QUEUE) private reindexQueue: Queue,
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

  @Post('reindex')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  async reindexBlogs(): Promise<{ jobId: string; status: string }> {
    // If a reindex is already queued or running, return that one.
    const running = await this.reindexQueue.getJobs(['active', 'waiting']);
    if (running.length > 0) {
      return { jobId: String(running[0].id), status: 'already-running' };
    }
    const job = await this.reindexQueue.add(
      REINDEX_JOB,
      {},
      {
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 3600 },
      },
    );
    return { jobId: String(job.id), status: 'queued' };
  }

  @Get('reindex/:jobId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  async reindexStatus(@Param('jobId') jobId: string): Promise<{
    jobId: string;
    state: string;
    progress: number;
    result: unknown;
  }> {
    const job = await this.reindexQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Reindex job not found');
    }
    return {
      jobId,
      state: await job.getState(),
      progress: typeof job.progress === 'number' ? job.progress : 0,
      result: job.returnvalue ?? null,
    };
  }

  @Get(':id/related')
  async relatedBlogs(
    @Param('id') id: string,
  ): Promise<{ related: Blog[]; cached: boolean }> {
    return this.blogsService.related(id);
  }

  @Get(':id')
  async getBlogs(
    @Param('id')
    id: string,
  ): Promise<Blog> {
    return this.blogsService.findById(id);
  }

  @Post(':id/summarize')
  @UseGuards(AuthGuard('jwt'))
  async summarizeBlog(
    @Param('id') id: string,
  ): Promise<{ summary: string; cached: boolean }> {
    return this.blogsService.summarize(id);
  }

  @Post(':id/auto-tag')
  @UseGuards(AuthGuard('jwt'))
  async autoTagBlog(
    @Param('id') id: string,
  ): Promise<{ suggestions: string[]; cached: boolean }> {
    return this.blogsService.autoTag(id);
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  async approvedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndApproved(id, status);
  }

  @Put('disapproved/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  async disApprovedBlog(
    @Param('id')
    id: string,
    status: Status,
  ): Promise<Blog> {
    return this.blogsService.findIdAndDisapproved(id, status);
  }
}
